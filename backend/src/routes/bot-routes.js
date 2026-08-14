import express from 'express'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pkgPg from 'pg'
const { Pool } = pkgPg
import { requireAuth } from '../middleware/auth.js'
import { trackUsage, hasEnoughMessages } from '../services/usage-tracker.js'
import { generateGeminiResponse, generateAgentResponse } from '../services/GeminiService.js';
import multer from 'multer'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const pdfParse = require('pdf-parse')

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const upload = multer({ storage: multer.memoryStorage() })
const router = express.Router()

// TELEGRAM HELPER
async function callTelegramAPI(method, botToken, payload) {
  const response = await fetch(
    `https://api.telegram.org/bot${botToken}/${method}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

// Strip Gemini markdown formatting for clean Telegram display
function cleanTelegramText(text) {
  if (!text) return text;
  // Remove **bold**, *italic*, __underline__, _italic_ markers
  return text
    .replace(/\*\*(.+?)\*\*/gs, '$1')
    .replace(/\*(.+?)\*/gs, '$1')
    .replace(/__(.+?)__/gs, '$1')
    .replace(/_(.+?)_/gs, '$1');
}

// Lazy Prisma init so DATABASE_URL is already loaded from .env
let _prisma = null
function getPrisma() {
    if (_prisma) return _prisma
    const url = process.env.DATABASE_URL
    if (!url) throw new Error('DATABASE_URL environment variable is not set')
    const pool = new Pool({ connectionString: url, max: 5 })
    const adapter = new PrismaPg(pool)
    _prisma = new PrismaClient({ adapter })
    return _prisma
}
export { getPrisma as prisma }

// Ownership guard for the operator/inbox routes. These take a bare numeric bot id and
// ids are sequential, so requireAuth alone is not enough — bot 42 must also be YOURS.
// Always chain it after requireAuth: it reads req.session.userId.
async function requireBotOwnership(req, res, next) {
    try {
        const botId = Number(req.params.id)
        if (!Number.isInteger(botId)) return res.status(400).json({ error: 'Invalid bot id' })

        const prisma = getPrisma()
        const bot = await prisma.bot.findFirst({
            where: { id: botId, user_id: req.session.userId }
        })

        // 404 (not 403) so the response can't be used to enumerate which bot ids exist.
        if (!bot) return res.status(404).json({ error: 'Bot not found' })

        req.bot = bot
        next()
    } catch (e) {
        res.status(500).json({ error: e.message })
    }
}

// ── BOTS ────────────────────────────────────────────────

// GET stats
router.get('/stats', requireAuth, async (req, res) => {
    try {
        const prisma = getPrisma()
        // Scoped to the caller's own bots — this feeds the per-user dashboard on /bots,
        // so platform-wide totals would both leak volume and be the wrong number to show.
        const messageCount = await prisma.message.count({
            where: { sender: 'bot', bot: { user_id: req.session.userId } }
        })
        const costPer1000 = 10 // $10 per 1000 messages
        const cost = (messageCount / 1000) * costPer1000
        res.json({ messageCount, cost: cost.toFixed(2) })
    } catch (e) { res.status(500).json({ error: e.message }) }
})

// GET all bots
router.get('/bot', requireAuth, async (req, res) => {
    try {
        const prisma = getPrisma()
        const bots = await prisma.bot.findMany({ 
            where: { user_id: req.session.userId },
            orderBy: { createdAt: 'desc' } 
        })
        res.json(bots)
    } catch (e) { res.status(500).json({ error: e.message }) }
})

// GET single bot
router.get('/bot/:id', requireAuth, async (req, res) => {
    try {
        const prisma = getPrisma()
        const bot = await prisma.bot.findUnique({ where: { id: Number(req.params.id), user_id: req.session.userId } })
        if (!bot) return res.status(404).json({ error: 'Bot not found' })
        res.json(bot)
    } catch (e) { res.status(500).json({ error: e.message }) }
})

// POST create bot
router.post('/bot', requireAuth, async (req, res) => {
    try {
        const prisma = getPrisma()
        const io = req.app.get('io')
        const { platform, system_prompt, data_prompt, apiToken } = req.body

        // Telegram & Instagram bots are immediately active (webhook-based, no QR needed)
        // WhatsApp starts inactive until QR is scanned
        const startsActive = platform === 'TELEGRAM' || platform === 'INSTAGRAM';

        const bot = await prisma.bot.create({
            data: {
                slug: `bot-${Date.now()}`,
                platform,
                system_prompt: system_prompt || '',
                data_prompt: data_prompt || '',
                apiToken: apiToken || null,
                isActive: startsActive,
                user_id: req.session.userId,
            }
        })

        res.json(bot)

        // Telegram Webhook Setup
        if (platform === 'TELEGRAM' && apiToken) {
            try {
                let baseUrl = process.env.BASE_URL || process.env.APP_URL || 'https://yourdomain.com';
                baseUrl = baseUrl.replace(/\/+$/, '');
                const webhookUrl = `${baseUrl}/api/webhook/telegram/${bot.slug}`;
                await callTelegramAPI('setWebhook', apiToken, { url: webhookUrl });
                console.log(`[Telegram] Webhook set to ${webhookUrl} | Bot isActive=true`);
            } catch (err) {
                console.error(`Failed to set Telegram Webhook for bot ${bot.id}:`, err.message);
            }
        }

        // Instagram: subscribe page to webhook events automatically
        if (platform === 'INSTAGRAM' && apiToken) {
            let baseUrl = process.env.BASE_URL || 'https://yourdomain.com';
            baseUrl = baseUrl.replace(/\/+$/, '');
            console.log(`[Instagram] Global Webhook URL: ${baseUrl}/api/webhook/instagram`);
            
            try {
                // Step 1: Get Page ID from the token
                const meRes = await fetch(`https://graph.facebook.com/v21.0/me?access_token=${apiToken}`);
                const meData = await meRes.json();
                const pageId = meData.id;

                if (pageId && !meData.error) {
                    // Step 2: Subscribe this page to receive 'messages' webhook events
                    const subRes = await fetch(
                        `https://graph.facebook.com/v21.0/${pageId}/subscribed_apps`,
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                subscribed_fields: ['messages', 'messaging_postbacks'],
                                access_token: apiToken
                            })
                        }
                    );
                    const subData = await subRes.json();
                    if (subData.success) {
                        console.log(`[Instagram] ✅ Page ${pageId} successfully subscribed to webhook messages!`);
                    } else {
                        console.warn(`[Instagram] ⚠️ Page subscription response:`, JSON.stringify(subData));
                    }
                } else {
                    console.warn(`[Instagram] ⚠️ Could not get Page ID from token. Error:`, JSON.stringify(meData));
                }
            } catch (igErr) {
                console.error(`[Instagram] Error during auto-subscribe:`, igErr.message);
            }
        }

        // Do NOT auto-start WhatsApp bot after creation to avoid background timeout overriding user actions
        // Wait for the user to explicitly connect via the UI (Generate QR)
    } catch (e) { res.status(500).json({ error: e.message }) }
})

// PUT update bot prompts
router.put('/bot/:id', requireAuth, async (req, res) => {
    try {
        const prisma = getPrisma()
        const { system_prompt, data_prompt, apiToken, googleSheetUrl, googleSheetColumns, googleCalendarId, bitrixWebhookUrl, bitrixFields } = req.body
        
        const user = await prisma.user.findUnique({ where: { id: req.session.userId } });
        const isPremium = ['PRO', 'GROWTH'].includes(user.subscriptionPlan);

        const updateData = {};
        if (system_prompt !== undefined) updateData.system_prompt = system_prompt;
        if (data_prompt !== undefined) updateData.data_prompt = data_prompt;
        if (apiToken !== undefined) updateData.apiToken = apiToken;
        
        // Only allow updating integration fields if the user has a premium subscription
        if (isPremium) {
            if (googleSheetUrl !== undefined) updateData.googleSheetUrl = googleSheetUrl;
            if (googleSheetColumns !== undefined) updateData.googleSheetColumns = googleSheetColumns;
            if (googleCalendarId !== undefined) updateData.googleCalendarId = googleCalendarId;
            if (bitrixWebhookUrl !== undefined) updateData.bitrixWebhookUrl = bitrixWebhookUrl;
            if (bitrixFields !== undefined) updateData.bitrixFields = bitrixFields;
        }

        const bot = await prisma.bot.update({
            where: { id: Number(req.params.id), user_id: req.session.userId },
            data: updateData
        })
        res.json(bot)
    } catch (e) { res.status(500).json({ error: e.message }) }
})

// DELETE bot
router.delete('/bot/:id', requireAuth, async (req, res) => {
    try {
        const prisma = getPrisma()
        const botId = Number(req.params.id)
        const bot = await prisma.bot.findUnique({ where: { id: botId, user_id: req.session.userId } })
        
        if (!bot) return res.status(404).json({ error: 'Bot not found' })

        // Stop WhatsApp session if running
        if (bot.platform === 'WHATSAPP') {
            try {
                // WhatsApp Cloud API is passive, no session to stop
            } catch (e) {}

            // Remove session files
            const { default: fs } = await import('fs')
            const { default: path } = await import('path')
            const { fileURLToPath } = await import('url')
            const __dirname = path.dirname(fileURLToPath(import.meta.url))
            const sessionDir = path.join(__dirname, `../../sessions/bot_${botId}`)
            try { fs.rmSync(sessionDir, { recursive: true, force: true }) } catch (e) {}
        }

        if (bot.platform === 'TELEGRAM' && bot.apiToken) {
            try {
                await callTelegramAPI('deleteWebhook', bot.apiToken, {})
            } catch (e) {}
        }

        await prisma.bot.delete({ where: { id: botId } })
        res.json({ success: true })
    } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── CHANNELS (Multi-platform per bot) ──────────────────

// GET channels for a bot
router.get('/bot/:id/channels', requireAuth, async (req, res) => {
    try {
        const prisma = getPrisma()
        const botId = Number(req.params.id)
        
        const bot = await prisma.bot.findUnique({ where: { id: botId, user_id: req.session.userId } })
        if (!bot) return res.status(404).json({ error: 'Bot not found' })
        
        const channels = await prisma.channel.findMany({
            where: { botId },
            orderBy: { createdAt: 'asc' }
        })
        
        // Don't add the base-bot entry if a real Channel record already exists for the same platform
        // This prevents duplicate WhatsApp/Telegram/Instagram cards
        const hasChannelForBotPlatform = channels.some(c => c.platform === bot.platform)
        
        // Determine if the base channel was intentionally deleted/disconnected:
        // - Telegram/Instagram: no apiToken = disconnected
        // - WhatsApp: check if session directory exists on disk (proof of active auth)
        let isBaseChannelDeleted = false;
        if (bot.platform === 'TELEGRAM' && !bot.apiToken) {
            isBaseChannelDeleted = true;
        } else if (bot.platform === 'INSTAGRAM' && !bot.apiToken) {
            isBaseChannelDeleted = true;
        } else if (bot.platform === 'WHATSAPP' && !bot.isActive) {
            // Only hide if the session directory does not exist on disk
            const { default: fs } = await import('fs');
            const { default: path } = await import('path');
            const { fileURLToPath } = await import('url');
            const __dirnameTmp = path.dirname(fileURLToPath(import.meta.url));
            const sessionDir = path.join(__dirnameTmp, `../../sessions/session_${botId}`);
            const credsFile = path.join(sessionDir, 'creds.json');
            if (!fs.existsSync(credsFile)) {
                isBaseChannelDeleted = true;
            }
        }
        
        // Filter out disconnected WhatsApp Channel records
        const { default: fs } = await import('fs');
        const { default: path } = await import('path');
        const { fileURLToPath } = await import('url');
        const __dirnameTmp = path.dirname(fileURLToPath(import.meta.url));
        
        const activeChannels = channels.filter(ch => {
            if (ch.platform === 'WHATSAPP' && !ch.isActive) {
                const sessionDir = path.join(__dirnameTmp, `../../sessions/session_ch_${ch.id}`);
                const credsFile = path.join(sessionDir, 'creds.json');
                if (!fs.existsSync(credsFile)) return false;
            }
            return true;
        });
        
        const allChannels = [
            ...((hasChannelForBotPlatform || isBaseChannelDeleted) ? [] : [{
                id: 'base-' + bot.id,
                platform: bot.platform,
                isActive: bot.isActive,
                slug: bot.slug,
                botId: bot.id,
                isBaseChannel: true
            }]),
            ...activeChannels
        ]
        
        res.json(allChannels)
    } catch (e) { res.status(500).json({ error: e.message }) }
})

// POST add a channel to a bot
router.post('/bot/:id/channels', requireAuth, async (req, res) => {
    try {
        const prisma = getPrisma()
        const io = req.app.get('io')
        const botId = Number(req.params.id)
        const { platform, apiToken } = req.body

        // Check bot belongs to user
        const bot = await prisma.bot.findUnique({ where: { id: botId, user_id: req.session.userId } })
        if (!bot) return res.status(404).json({ error: 'Bot not found' })

        // Check no duplicate platform channel for this bot
        const existing = await prisma.channel.findFirst({ where: { botId, platform } })
        if (existing) return res.status(400).json({ error: `Channel for ${platform} already exists` })

        const startsActive = platform === 'TELEGRAM' || platform === 'INSTAGRAM'

        const channel = await prisma.channel.create({
            data: {
                botId,
                platform,
                apiToken: apiToken || null,
                isActive: startsActive,
                slug: `ch-${botId}-${platform.toLowerCase()}-${Date.now()}`,
            }
        })

        res.json(channel)

        // Instagram: subscribe page to webhook events automatically
        if (platform === 'INSTAGRAM' && apiToken) {
            try {
                // Step 1: Get Page ID from the token
                const meRes = await fetch(`https://graph.facebook.com/v21.0/me?access_token=${apiToken}`);
                const meData = await meRes.json();
                const pageId = meData.id;

                if (pageId && !meData.error) {
                    // Step 2: Subscribe this page to receive 'messages' webhook events
                    const subRes = await fetch(
                        `https://graph.facebook.com/v21.0/${pageId}/subscribed_apps`,
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                subscribed_fields: ['messages', 'messaging_postbacks'],
                                access_token: apiToken
                            })
                        }
                    );
                    const subData = await subRes.json();
                    if (subData.success) {
                        console.log(`[Instagram Channel ${channel.id}] ✅ Page ${pageId} successfully subscribed to webhook messages!`);
                    } else {
                        console.warn(`[Instagram Channel ${channel.id}] ⚠️ Page subscription response:`, JSON.stringify(subData));
                    }
                } else {
                    console.warn(`[Instagram Channel ${channel.id}] ⚠️ Could not get Page ID from token. Error:`, JSON.stringify(meData));
                }
            } catch (igErr) {
                console.error(`[Instagram Channel ${channel.id}] Error during auto-subscribe:`, igErr.message);
            }
        }

        // Telegram Webhook Setup
        if (platform === 'TELEGRAM' && apiToken) {
            try {
                let baseUrl = process.env.BASE_URL || process.env.APP_URL || 'https://yourdomain.com'
                baseUrl = baseUrl.replace(/\/+$/, '')
                const webhookUrl = `${baseUrl}/api/webhook/telegram/${channel.slug}`
                await callTelegramAPI('setWebhook', apiToken, { url: webhookUrl })
                console.log(`[Telegram Channel ${channel.id}] Webhook set to ${webhookUrl}`)
            } catch (err) {
                console.error(`[Telegram Channel ${channel.id}] Failed to set webhook:`, err.message)
            }
        }

        // WhatsApp Cloud API - no longer starts via Baileys QR
        if (platform === 'WHATSAPP') {
            // Just return the channel, it will be configured via Embedded Signup.
        }
    } catch (e) { res.status(500).json({ error: e.message }) }
})

// DELETE a channel
router.delete('/bot/:id/channels/:channelId', requireAuth, async (req, res) => {
    try {
        const prisma = getPrisma()
        const botId = Number(req.params.id)
        const channelIdParam = req.params.channelId

        // Verify ownership via bot
        const bot = await prisma.bot.findUnique({ where: { id: botId, user_id: req.session.userId } })
        if (!bot) return res.status(404).json({ error: 'Bot not found' })

        if (channelIdParam.startsWith('base-')) {
            // It's a base bot channel. We can't delete the bot, but we can stop it and clear token.
            if (bot.platform === 'TELEGRAM' && bot.apiToken) {
                try { await callTelegramAPI('deleteWebhook', bot.apiToken, {}) } catch (e) {}
            }
            if (bot.platform === 'WHATSAPP') {
                // Cloud API is passive
            }
            await prisma.bot.update({
                where: { id: botId },
                data: { isActive: false, apiToken: null }
            })
            return res.json({ success: true })
        }

        const channelId = Number(channelIdParam)
        const channel = await prisma.channel.findUnique({ where: { id: channelId, botId } })
        if (!channel) return res.status(404).json({ error: 'Channel not found' })

        // Clean up
        if (channel.platform === 'TELEGRAM' && channel.apiToken) {
            try { await callTelegramAPI('deleteWebhook', channel.apiToken, {}) } catch (e) {}
        }
        
        if (channel.platform === 'WHATSAPP') {
            // Cloud API is passive
        }

        await prisma.channel.delete({ where: { id: channelId } })
        
        // Fix ghost channel bug: if this was the last channel for this platform, mark base bot inactive
        const remainingChannels = await prisma.channel.count({ where: { botId, platform: channel.platform } })
        if (remainingChannels === 0) {
            await prisma.bot.update({ where: { id: botId }, data: { isActive: false } })
        }
        
        res.json({ success: true })
    } catch (e) { res.status(500).json({ error: e.message }) }
})

// POST toggle channel active state
router.post('/bot/:id/channels/:channelId/toggle', requireAuth, async (req, res) => {
    try {
        const prisma = getPrisma()
        const io = req.app.get('io')
        const botId = Number(req.params.id)
        const channelIdParam = req.params.channelId

        const bot = await prisma.bot.findUnique({ where: { id: botId, user_id: req.session.userId } })
        if (!bot) return res.status(404).json({ error: 'Bot not found' })

        if (channelIdParam.startsWith('base-')) {
            const updated = await prisma.bot.update({
                where: { id: botId },
                data: { isActive: !bot.isActive }
            })
            
            if (!bot.isActive) {
                if (bot.platform === 'WHATSAPP') {
                    // WhatsApp Cloud is passive
                } else if (bot.platform === 'TELEGRAM' && bot.apiToken) {
                    try {
                        let baseUrl = process.env.BASE_URL || process.env.APP_URL || 'https://yourdomain.com';
                        baseUrl = baseUrl.replace(/\/+$/, '');
                        const webhookUrl = `${baseUrl}/api/webhook/telegram/${bot.slug}`;
                        await callTelegramAPI('setWebhook', bot.apiToken, { url: webhookUrl });
                    } catch (err) {}
                }
            } else {
                if (bot.platform === 'WHATSAPP') {
                    // WhatsApp Cloud is passive
                }
            }
            return res.json(updated)
        }

        const channelId = Number(channelIdParam)
        const channel = await prisma.channel.findUnique({ where: { id: channelId, botId } })
        if (!channel) return res.status(404).json({ error: 'Channel not found' })

        const updated = await prisma.channel.update({
            where: { id: channelId },
            data: { isActive: !channel.isActive }
        })

        if (!channel.isActive && channel.platform === 'WHATSAPP') {
            // WhatsApp Cloud is passive
        } else if (channel.isActive && channel.platform === 'WHATSAPP') {
            // WhatsApp Cloud is passive
        }

        res.json(updated)
    } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── BOT STATUS / PAUSE ───────────────────────────────────

// POST /api/bot/:id/pause — полностью останавливает бота (isActive = false + отключает сокет)
router.post('/bot/:id/pause', requireAuth, requireBotOwnership, async (req, res) => {
    try {
        const prisma = getPrisma()
        const botId = Number(req.params.id)

        const bot = await prisma.bot.update({
            where: { id: botId },
            data: { isActive: false }
        })

        // WhatsApp Cloud API is passive, no socket to stop

        res.json({ success: true, isActive: false })
    } catch (e) { res.status(500).json({ error: e.message }) }
})

// POST /api/bot/:id/start — запускает бота (isActive = true + reconnect)
router.post('/bot/:id/start', requireAuth, requireBotOwnership, async (req, res) => {
    try {
        const prisma = getPrisma()
        const io = req.app.get('io')
        const botId = Number(req.params.id)

        const bot = await prisma.bot.update({
            where: { id: botId },
            data: { isActive: true }
        })

        if (bot.platform === 'WHATSAPP') {
            // For WhatsApp Cloud, toggling isActive in DB is enough.
        } else if (bot.platform === 'TELEGRAM' && bot.apiToken) {
            try {
                let baseUrl = process.env.BASE_URL || process.env.APP_URL || 'https://yourdomain.com';
                baseUrl = baseUrl.replace(/\/+$/, '');
                const webhookUrl = `${baseUrl}/api/webhook/telegram/${bot.slug}`;
                await callTelegramAPI('setWebhook', bot.apiToken, { url: webhookUrl });
                console.log(`Telegram webhook refreshed to ${webhookUrl}`);
            } catch (err) {
                console.error(`Failed to refresh Telegram Webhook for bot ${bot.id}:`, err.message);
            }
        }

        res.json({ success: true, isActive: true })
    } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── MESSAGES / CHATS ─────────────────────────────────────

// GET all messages for a bot (all chats combined)
router.get('/bot/:id/messages', requireAuth, requireBotOwnership, async (req, res) => {
    try {
        const prisma = getPrisma()
        const msgs = await prisma.message.findMany({
            where: { botId: Number(req.params.id) },
            orderBy: { createdAt: 'asc' }
        })
        res.json(msgs)
    } catch (e) { res.status(500).json({ error: e.message }) }
})

// GET list of unique chat contacts for a bot
// Returns: [{ chatId, lastMessage, lastAt, unreadCount, name }]
router.get('/bot/:id/chats', requireAuth, requireBotOwnership, async (req, res) => {
    const botId = Number(req.params.id)
    try {
        const prisma = getPrisma()

        const bot = await prisma.bot.findUnique({ where: { id: botId } });
        
        if (bot && bot.platform === 'WHATSAPP') {
            // ONE-TIME FIX: Merge legacy number-only chatIds with @s.whatsapp.net
            const legacyContacts = await prisma.contact.findMany({
                where: { botId, chatId: { not: { contains: '@' } } }
            });
            
            for (const lc of legacyContacts) {
                const newId = `${lc.chatId}@s.whatsapp.net`;
                try {
                    // Update messages
                    await prisma.message.updateMany({
                        where: { botId, chatId: lc.chatId },
                        data: { chatId: newId }
                    });
                    
                    // Try to update contact or merge name if exists
                    const existing = await prisma.contact.findUnique({ where: { botId_chatId: { botId, chatId: newId } } });
                    if (existing) {
                        if (lc.name && lc.name !== 'Contact') {
                            await prisma.contact.update({ where: { botId_chatId: { botId, chatId: newId } }, data: { name: lc.name } });
                        }
                        await prisma.contact.delete({ where: { botId_chatId: { botId, chatId: lc.chatId } } });
                    } else {
                        await prisma.contact.update({ where: { botId_chatId: { botId, chatId: lc.chatId } }, data: { chatId: newId } });
                    }
                } catch (e) { console.error('Error migrating legacy contact:', e); }
            }
        } else if (bot && bot.platform === 'TELEGRAM') {
            // ONE-TIME FIX: Strip @s.whatsapp.net from corrupted Telegram contacts
            const corruptedContacts = await prisma.contact.findMany({
                where: { botId, chatId: { contains: '@' } }
            });
            
            for (const cc of corruptedContacts) {
                const cleanId = cc.chatId.split('@')[0];
                try {
                    // Update messages
                    await prisma.message.updateMany({
                        where: { botId, chatId: cc.chatId },
                        data: { chatId: cleanId }
                    });
                    
                    // Try to update contact or merge name if exists
                    const existing = await prisma.contact.findUnique({ where: { botId_chatId: { botId, chatId: cleanId } } });
                    if (existing) {
                        if (cc.name && cc.name !== 'Contact' && existing.name === 'Contact') {
                            await prisma.contact.update({ where: { botId_chatId: { botId, chatId: cleanId } }, data: { name: cc.name } });
                        }
                        await prisma.contact.delete({ where: { botId_chatId: { botId, chatId: cc.chatId } } });
                    } else {
                        await prisma.contact.update({ where: { botId_chatId: { botId, chatId: cc.chatId } }, data: { chatId: cleanId } });
                    }
                } catch (e) { console.error('Error fixing corrupted telegram contact:', e); }
            }
        }

        // Get the last message per chatId
        const allMessages = await prisma.message.findMany({
            where: { botId },
            orderBy: { createdAt: 'asc' }
        })

        const contacts = await prisma.contact.findMany({
            where: { botId }
        })
        const contactMap = new Map()
        const realJidMap = new Map()
        const contactStatusMap = new Map()
        const unreadCountMap = new Map()
        contacts.forEach(c => {
            if (c.name && c.name !== 'Contact') {
                contactMap.set(c.chatId, c.name)
            }
            contactStatusMap.set(c.chatId, c.status || 'Все')
            unreadCountMap.set(c.chatId, c.unreadCount || 0)
            if (c.realJid) {
                realJidMap.set(c.chatId, c.realJid)
                // Transfer name to JID so it isn't lost if messages moved to JID
                if (c.name && c.name !== 'Contact') {
                    if (!contactMap.has(c.realJid)) {
                        contactMap.set(c.realJid, c.name)
                    }
                }
                if (!contactStatusMap.has(c.realJid)) {
                    contactStatusMap.set(c.realJid, c.status || 'Все')
                }
                if (!unreadCountMap.has(c.realJid)) {
                    unreadCountMap.set(c.realJid, c.unreadCount || 0)
                }
            }
        })

        const analytics = await prisma.chatAnalytics.findMany({
            where: { botId }
        })
        const analyticsMap = new Map()
        analytics.forEach(a => {
            analyticsMap.set(a.chatId, a.funnelStage || 'Лид')
        })

        // Group by chatId
        const chatMap = new Map()
        for (const msg of allMessages) {
            const rawId = msg.chatId
            
            // Пропускаем status@broadcast
            if (!rawId || rawId.includes('status@broadcast')) {
                continue
            }

            // Определяем платформу: если поле platform не заполнено (старые сообщения),
            // то определяем по формату chatId: @ = WhatsApp, иначе Telegram
            const platform = msg.platform 
                ? msg.platform 
                : (rawId.includes('@s.whatsapp.net') || rawId.includes('@lid') || rawId.includes('@g.us')) 
                    ? 'WHATSAPP' 
                    : 'TELEGRAM';

            chatMap.set(rawId, {
                chatId: rawId,
                lastMessage: msg.text,
                lastAt: msg.createdAt,
                lastSender: msg.sender,
                name: contactMap.get(rawId) || '',
                realJid: realJidMap.get(rawId) || null,
                platform,
                channelId: msg.channelId || null,
                status: contactStatusMap.get(rawId) || 'Все',
                unreadCount: unreadCountMap.get(rawId) || 0,
                funnelStage: analyticsMap.get(rawId) || (realJidMap.has(rawId) ? analyticsMap.get(realJidMap.get(rawId)) : undefined) || 'Лид'
            })
        }

        // Убрали добавление пустых контактов (у которых нет сообщений), 
        // чтобы синхронизация телефонной книги WhatsApp не засоряла список чатов пустыми беседами.
        const chats = Array.from(chatMap.values()).sort(
            (a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime()
        )
        console.log(`[Chats] Bot ${botId}: returning ${chats.length} chats (Contacts in DB: ${contacts.length})`)
        res.json(chats)
    } catch (e) { 
        console.error(`[Chats Error] Bot ${botId}:`, e)
        res.status(500).json({ error: e.message }) 
    }
})

// POST update contact name
router.post('/bot/:id/contact/name', requireAuth, requireBotOwnership, async (req, res) => {
    try {
        const prisma = getPrisma()
        const botId = Number(req.params.id)
        const { chatId, name } = req.body

        if (!chatId || name === undefined) return res.status(400).json({ error: 'chatId and name are required' })

        const contact = await prisma.contact.upsert({
            where: { botId_chatId: { botId, chatId } },
            update: { name },
            create: { botId, chatId, name }
        })

        res.json({ success: true, contact })
    } catch (e) { res.status(500).json({ error: e.message }) }
})

// POST delete contact (and its messages)
router.post('/bot/:id/contact/delete', requireAuth, requireBotOwnership, async (req, res) => {
    try {
        const prisma = getPrisma()
        const botId = Number(req.params.id)
        const { chatId } = req.body

        if (!chatId) return res.status(400).json({ error: 'chatId is required' })

        // Delete all messages first
        await prisma.message.deleteMany({
            where: { botId, chatId }
        })

        // Delete the contact
        await prisma.contact.delete({
            where: { botId_chatId: { botId, chatId } }
        }).catch(() => {}) // Ignore if contact didn't exist

        res.json({ success: true })
    } catch (e) { res.status(500).json({ error: e.message }) }
})

// GET messages for a specific chat (chatId as query param)
// GET /api/bot/:id/chat?chatId=79991234567
router.get('/bot/:id/chat', requireAuth, requireBotOwnership, async (req, res) => {
    try {
        const prisma = getPrisma()
        const botId = Number(req.params.id)
        const { chatId } = req.query

        if (!chatId) return res.status(400).json({ error: 'chatId is required' })

        const msgs = await prisma.message.findMany({
            where: { botId, chatId: String(chatId) },
            orderBy: { createdAt: 'asc' }
        })
        res.json(msgs)
    } catch (e) { res.status(500).json({ error: e.message }) }
})

// POST delete all messages for a specific chat (using POST because DELETE is sometimes blocked)
router.post('/bot/:id/chat/delete', requireAuth, requireBotOwnership, async (req, res) => {
    try {
        const prisma = getPrisma()
        const botId = Number(req.params.id)
        const { chatId } = req.body // Changed from query to body for POST consistency

        if (!chatId) return res.status(400).json({ error: 'chatId is required' })
        const rawId = String(chatId)
        
        console.log(`[Backend] Deleting chat history: Bot ${botId}, Chat ${rawId}`)
        
        const deleted = await prisma.message.deleteMany({
            where: { botId, chatId: rawId }
        })
        
        console.log(`[Backend] Deleted ${deleted.count} messages for ${rawId}`)
        res.json({ success: true, count: deleted.count })
    } catch (e) { 
        console.error('[Backend] Delete error:', e)
        res.status(500).json({ error: e.message }) 
    }
})

// POST send message to a specific chat
// Body: { text, chatId }
// Guards run before multer so an unauthenticated upload is rejected before its bytes
// are buffered into memory.
router.post('/bot/:id/send', requireAuth, requireBotOwnership, upload.single('file'), async (req, res) => {
    try {
        const prisma = getPrisma()
        const botId = Number(req.params.id)
        const io = req.app.get('io')
        const { text, chatId: rawChatId } = req.body

        if (!text && !req.file) return res.status(400).json({ error: 'text or file is required' })
        if (!rawChatId) return res.status(400).json({ error: 'chatId is required' })

        const bot = await prisma.bot.findUnique({ where: { id: botId } })
        if (!bot) return res.status(404).json({ error: 'Bot not found' })

        let mediaUrl = null;
        let mediaType = null;
        let filePath = null;
        // WhatsApp message id of what we just sent. Under Coexistence the same message is
        // echoed back to our webhook; storing the id lets the echo handler recognise it
        // instead of adding a second copy to the transcript.
        let sentWamid = null;

        let originalNameUtf8 = req.file ? req.file.originalname : '';
        if (req.file) {
            try {
                originalNameUtf8 = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
            } catch(e) {}
            const ext = path.extname(originalNameUtf8) || '';
            const filename = `${Date.now()}-${Math.floor(Math.random() * 10000)}${ext}`;
            filePath = path.join(__dirname, '../../uploads', filename);
            fs.writeFileSync(filePath, req.file.buffer);
            
            mediaUrl = `/uploads/${filename}`;
            if (req.file.mimetype.startsWith('image/')) {
                mediaType = 'image';
            } else if (req.file.mimetype.startsWith('video/')) {
                mediaType = 'video';
            } else if (req.file.mimetype.startsWith('audio/')) {
                mediaType = 'audio';
                try {
                    const { execSync } = require('child_process');
                    // WhatsApp and Telegram both require Opus-in-OGG for voice notes.
                    // Write to a distinct temp path first — ffmpeg refuses to write its own input.
                    const tmpPath = `${filePath}.opus.ogg`;
                    execSync(`ffmpeg -i "${filePath}" -c:a libopus -b:a 32k -vbr on "${tmpPath}" -y`, { stdio: 'ignore' });
                    req.file.buffer = fs.readFileSync(tmpPath);
                    req.file.mimetype = 'audio/ogg';
                    // Serve the converted bytes under a .ogg name: an .mp3/.webm filename holding
                    // OGG data gets the wrong Content-Type from express.static and won't play.
                    // (The browser recorder labels its blob .ogg but Chrome actually emits WebM.)
                    const oggPath = filePath.replace(/\.[^.]*$/, '') + '.ogg';
                    fs.unlinkSync(filePath);
                    fs.renameSync(tmpPath, oggPath);
                    filePath = oggPath;
                    mediaUrl = `/uploads/${path.basename(oggPath)}`;
                } catch(err) {
                    console.log('FFMPEG audio conversion failed (or ffmpeg not installed). Using original buffer.', err.message);
                }
            } else {
                mediaType = 'document';
            }
        }

        // ── STEP 1: Resolve the real JID for this contact ─────────────────────
        // Contact might be stored under LID (e.g. 12345@lid) with realJid pointing to the real number.
        // Or it might be stored directly under realJid. Check both cases.
        let realChatId = rawChatId;
        try {
            // First try: match by chatId (could be LID or realJid)
            let contactRecord = await prisma.contact.findFirst({
                where: { botId, chatId: rawChatId }
            });
            // Second try: maybe rawChatId IS the realJid and the contact record uses a LID as chatId
            if (!contactRecord) {
                contactRecord = await prisma.contact.findFirst({
                    where: { botId, realJid: rawChatId }
                });
            }
            if (contactRecord?.realJid) {
                realChatId = contactRecord.realJid;
                console.log(`[SendRoute] Resolved ${rawChatId} → realJid: ${realChatId}`);
            }
        } catch (e) {
            console.error('[SendRoute] Error resolving contact realJid:', e.message);
        }

        // ── STEP 2: Find last message by BOTH rawChatId and realChatId ─────────
        // This ensures we find channelId even if messages were saved under a different variant
        const lastMsg = await prisma.message.findFirst({
            where: { botId, chatId: { in: [...new Set([rawChatId, realChatId])] } },
            orderBy: { createdAt: 'desc' }
        });

        const platform = lastMsg?.platform || bot.platform;
        let channelId = lastMsg?.channelId || null;
        let apiToken = bot.apiToken;

        // CRITICAL FIX: If there is an active WA channel for this bot, we MUST use it.
        // Otherwise, we might fall back to a legacy botId session which has stale encryption keys,
        // causing WhatsApp to silently drop the message (decryption failure) even though 'typing' works.
        if (platform === 'WHATSAPP') {
            try {
                const activeWaChannel = await prisma.channel.findFirst({
                    where: { botId, platform: 'WHATSAPP', isActive: true },
                    orderBy: { updatedAt: 'desc' }
                });
                if (activeWaChannel) {
                    channelId = activeWaChannel.id;
                }
            } catch (e) {
                console.error('[SendRoute] Error checking active channels:', e.message);
            }
        }

        if (channelId) {
            const channel = await prisma.channel.findUnique({ where: { id: channelId } });
            if (channel) {
                apiToken = channel.apiToken || apiToken;
            }
        }

        // Final resolved chatId to use for sending
        let chatId = realChatId;

        if (platform === 'WHATSAPP') {
            const {
                sendWhatsAppCloudMessage,
                sendWhatsAppCloudMedia,
                uploadWhatsAppMedia,
                toWaId
            } = await import('../services/whatsapp-cloud.js');

            // The Cloud API addresses recipients by bare wa_id. Legacy Baileys rows may still
            // carry a JID (`...@s.whatsapp.net` / `...@c.us`), so strip the domain for delivery
            // but keep `chatId` as-is so the reply is stored in the thread the operator is viewing.
            const waRecipient = toWaId(chatId);
            if (!waRecipient) {
                return res.status(400).json({ error: `Cannot resolve a WhatsApp number from "${rawChatId}".` });
            }

            // The phone number id lives on the Channel (set during Embedded Signup), never on Bot.
            const waChannel = channelId
                ? await prisma.channel.findUnique({ where: { id: channelId } })
                : await prisma.channel.findFirst({
                    where: { botId, platform: 'WHATSAPP' },
                    orderBy: { updatedAt: 'desc' }
                });

            const cloudApiToken = waChannel?.apiToken || apiToken || process.env.WA_SYSTEM_USER_TOKEN;
            const phoneNumberId = waChannel?.whatsappPhoneNumberId;

            console.log(`[SendRoute] Bot=${botId}, rawChatId=${rawChatId}, to=${waRecipient}, phoneNumberId=${phoneNumberId}, using Cloud API`);

            if (!phoneNumberId || !cloudApiToken) {
                return res.status(503).json({ error: 'WhatsApp is not connected for this bot. Reconnect it in the channel settings.' });
            }

            if (waChannel?.id) channelId = waChannel.id;

            // ── STEP 3: Send via Cloud API ──────────────────────────────
            try {
                if (req.file && mediaType) {
                    const waType = mediaType === 'document' ? 'document' : mediaType;
                    const mediaId = await uploadWhatsAppMedia(
                        phoneNumberId,
                        req.file.buffer,
                        req.file.mimetype,
                        originalNameUtf8 || path.basename(filePath || 'upload'),
                        cloudApiToken
                    );
                    const sendResult = await sendWhatsAppCloudMedia(
                        phoneNumberId,
                        waRecipient,
                        { type: waType, mediaId, caption: text || '', filename: originalNameUtf8 },
                        cloudApiToken
                    );
                    sentWamid = sendResult?.messages?.[0]?.id || null;
                    console.log(`[SendRoute] ✅ ${waType} delivered to ${waRecipient}, msgId=${sentWamid}`);

                    // WhatsApp drops captions on audio, so send any accompanying text separately.
                    if (waType === 'audio' && text) {
                        await sendWhatsAppCloudMessage(phoneNumberId, waRecipient, text, cloudApiToken);
                    }
                } else {
                    const sendResult = await sendWhatsAppCloudMessage(phoneNumberId, waRecipient, text || '', cloudApiToken);
                    sentWamid = sendResult?.messages?.[0]?.id || null;
                    console.log(`[SendRoute] ✅ Message delivered to ${waRecipient}, msgId=${sentWamid}`);
                }
            } catch (err) {
                console.error(`[SendRoute] ❌ WhatsApp Cloud send FAILED for ${waRecipient}:`, err.message);
                // 131047: the 24h customer service window has closed — only templates are allowed.
                if (err.code === 131047) {
                    return res.status(400).json({
                        error: 'Прошло больше 24 часов с последнего сообщения клиента. WhatsApp разрешает написать первым только через одобренный шаблон.'
                    });
                }
                return res.status(502).json({ error: `WhatsApp send failed: ${err.message}` });
            }

        } else if (platform === 'TELEGRAM') {
            if (!apiToken) return res.status(503).json({ error: 'Telegram API token missing.' });
            
            if (req.file && mediaType === 'image') {
                const formData = new FormData();
                formData.append('chat_id', chatId);
                if (text) formData.append('caption', text);
                
                const fileData = typeof Blob !== 'undefined' 
                    ? new Blob([fs.readFileSync(filePath)], { type: req.file.mimetype })
                    : fs.createReadStream(filePath);
                formData.append('photo', fileData, req.file.originalname);
                
                const response = await fetch(`https://api.telegram.org/bot${apiToken}/sendPhoto`, {
                    method: 'POST',
                    body: formData
                });
                if (!response.ok) throw new Error(await response.text());
            } else if (req.file && mediaType === 'video') {
                const formData = new FormData();
                formData.append('chat_id', chatId);
                if (text) formData.append('caption', text);
                
                const fileData = typeof Blob !== 'undefined' 
                    ? new Blob([fs.readFileSync(filePath)], { type: req.file.mimetype })
                    : fs.createReadStream(filePath);
                formData.append('video', fileData, req.file.originalname);
                
                const response = await fetch(`https://api.telegram.org/bot${apiToken}/sendVideo`, {
                    method: 'POST',
                    body: formData
                });
                if (!response.ok) throw new Error(await response.text());
            } else if (req.file && mediaType === 'audio') {
                const formData = new FormData();
                formData.append('chat_id', chatId);
                if (text) formData.append('caption', text);
                
                const isOgg = req.file.mimetype.includes('ogg');
                const fieldName = isOgg ? 'voice' : 'audio';
                const method = isOgg ? 'sendVoice' : 'sendAudio';
                
                const fileData = typeof Blob !== 'undefined' 
                    ? new Blob([fs.readFileSync(filePath)], { type: req.file.mimetype })
                    : fs.createReadStream(filePath);
                formData.append(fieldName, fileData, req.file.originalname);
                
                const response = await fetch(`https://api.telegram.org/bot${apiToken}/${method}`, {
                    method: 'POST',
                    body: formData
                });
                if (!response.ok) throw new Error(await response.text());
            } else if (req.file && mediaType === 'document') {
                const formData = new FormData();
                formData.append('chat_id', chatId);
                if (text) formData.append('caption', text);
                
                const fileData = typeof Blob !== 'undefined' 
                    ? new Blob([fs.readFileSync(filePath)], { type: req.file.mimetype })
                    : fs.createReadStream(filePath);
                formData.append('document', fileData, req.file.originalname);
                
                const response = await fetch(`https://api.telegram.org/bot${apiToken}/sendDocument`, {
                    method: 'POST',
                    body: formData
                });
                if (!response.ok) throw new Error(await response.text());
            } else {
                await callTelegramAPI('sendMessage', apiToken, {
                    chat_id: chatId,
                    text: text || ''
                });
            }
        }

        // Save sent message to DB — only reached if send succeeded (no early return above)
        let textToSave = text || (req.file ? originalNameUtf8 : '');
        if (mediaType === 'audio' && !text) textToSave = '';
        const savedMsg = await prisma.message.create({
            data: { botId, channelId, platform, sender: 'bot', text: textToSave, chatId, mediaUrl, mediaType, waMessageId: sentWamid }
        })

        io.emit(`chat-${botId}`, { ...savedMsg, platform })
        res.json({ success: true, message: savedMsg })
    } catch (e) { res.status(500).json({ error: e.message }) }
})


// POST broadcast to multiple numbers
// Body: { text, chatIds: string[] }
router.post('/bot/:id/broadcast', requireAuth, requireBotOwnership, upload.single('file'), async (req, res) => {
    try {
        const botId = Number(req.params.id)
        const prisma = getPrisma()
        const io = req.app.get('io')
        const { text, chatIds } = req.body

        let parsedChatIds = chatIds;
        if (typeof chatIds === 'string') {
            try {
                parsedChatIds = JSON.parse(chatIds);
            } catch (e) {
                parsedChatIds = chatIds.split(',').map(id => id.trim());
            }
        }

        if (!text && !req.file) return res.status(400).json({ error: 'text or file is required' })
        if (!parsedChatIds?.length) return res.status(400).json({ error: 'chatIds are required' })

        const bot = await prisma.bot.findUnique({ where: { id: botId } })
        if (!bot) return res.status(404).json({ error: 'Bot not found' })

        let mediaUrl = null;
        let mediaType = null;
        let filePath = null;

        let originalNameUtf8 = req.file ? req.file.originalname : '';
        if (req.file) {
            try {
                originalNameUtf8 = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
            } catch(e) {}
            const ext = path.extname(originalNameUtf8) || '';
            const filename = `${Date.now()}-${Math.floor(Math.random() * 10000)}${ext}`;
            filePath = path.join(__dirname, '../../uploads', filename);
            fs.writeFileSync(filePath, req.file.buffer);
            
            mediaUrl = `/uploads/${filename}`;
            if (req.file.mimetype.startsWith('image/')) {
                mediaType = 'image';
            } else if (req.file.mimetype.startsWith('video/')) {
                mediaType = 'video';
            } else if (req.file.mimetype.startsWith('audio/')) {
                mediaType = 'audio';
                try {
                    const { execSync } = require('child_process');
                    // WhatsApp and Telegram both require Opus-in-OGG for voice notes.
                    // Write to a distinct temp path first — ffmpeg refuses to write its own input.
                    const tmpPath = `${filePath}.opus.ogg`;
                    execSync(`ffmpeg -i "${filePath}" -c:a libopus -b:a 32k -vbr on "${tmpPath}" -y`, { stdio: 'ignore' });
                    req.file.buffer = fs.readFileSync(tmpPath);
                    req.file.mimetype = 'audio/ogg';
                    // Serve the converted bytes under a .ogg name: an .mp3/.webm filename holding
                    // OGG data gets the wrong Content-Type from express.static and won't play.
                    // (The browser recorder labels its blob .ogg but Chrome actually emits WebM.)
                    const oggPath = filePath.replace(/\.[^.]*$/, '') + '.ogg';
                    fs.unlinkSync(filePath);
                    fs.renameSync(tmpPath, oggPath);
                    filePath = oggPath;
                    mediaUrl = `/uploads/${path.basename(oggPath)}`;
                } catch(err) {
                    console.log('FFMPEG audio conversion failed (or ffmpeg not installed). Using original buffer.', err.message);
                }
            } else {
                mediaType = 'document';
            }
        }

        const results = []

        if (bot.platform === 'WHATSAPP') {
            const {
                sendWhatsAppCloudMessage,
                sendWhatsAppCloudMedia,
                uploadWhatsAppMedia,
                toWaId
            } = await import('../services/whatsapp-cloud.js')

            const waChannel = await prisma.channel.findFirst({
                where: { botId, platform: 'WHATSAPP' },
                orderBy: { updatedAt: 'desc' }
            })
            const cloudApiToken = waChannel?.apiToken || bot.apiToken || process.env.WA_SYSTEM_USER_TOKEN
            const phoneNumberId = waChannel?.whatsappPhoneNumberId

            if (!phoneNumberId || !cloudApiToken) {
                return res.status(503).json({ error: 'WhatsApp is not connected for this bot.' })
            }

            // Upload the attachment once and reuse the media id for every recipient.
            let sharedMediaId = null
            if (req.file && mediaType) {
                try {
                    sharedMediaId = await uploadWhatsAppMedia(
                        phoneNumberId,
                        req.file.buffer,
                        req.file.mimetype,
                        originalNameUtf8 || 'upload',
                        cloudApiToken
                    )
                } catch (upErr) {
                    return res.status(502).json({ error: `WhatsApp media upload failed: ${upErr.message}` })
                }
            }

            for (const rawId of parsedChatIds) {
                try {
                    let jid = rawId;
                    const contact = await prisma.contact.findFirst({ where: { botId, chatId: rawId, realJid: { not: null } } });
                    if (contact && contact.realJid) {
                        jid = contact.realJid;
                    }
                    const waRecipient = toWaId(jid)
                    if (!waRecipient) throw new Error(`Cannot resolve a WhatsApp number from "${rawId}"`)

                    // Keep the wamid so the Coexistence echo of this broadcast is recognised
                    // and not stored a second time.
                    let broadcastWamid = null;
                    if (sharedMediaId) {
                        const mediaResult = await sendWhatsAppCloudMedia(
                            phoneNumberId,
                            waRecipient,
                            { type: mediaType, mediaId: sharedMediaId, caption: text || '', filename: originalNameUtf8 },
                            cloudApiToken
                        )
                        broadcastWamid = mediaResult?.messages?.[0]?.id || null;
                        if (mediaType === 'audio' && text) {
                            await sendWhatsAppCloudMessage(phoneNumberId, waRecipient, text, cloudApiToken)
                        }
                    } else {
                        const textResult = await sendWhatsAppCloudMessage(phoneNumberId, waRecipient, text || '', cloudApiToken)
                        broadcastWamid = textResult?.messages?.[0]?.id || null;
                    }

                    let textToSave = text || (req.file ? originalNameUtf8 : '');
                    if (mediaType === 'audio' && !text) textToSave = '';
                    const savedMsg = await prisma.message.create({
                        data: { botId, channelId: waChannel.id, platform: 'WHATSAPP', sender: 'bot', text: textToSave, chatId: jid, mediaUrl, mediaType, waMessageId: broadcastWamid }
                    })
                    io.emit(`chat-${botId}`, savedMsg)
                    results.push({ chatId: jid, success: true })

                    // Meta rate-limits the Cloud API; keep a modest gap between recipients.
                    await new Promise(r => setTimeout(r, 1000));
                } catch (err) {
                    results.push({ chatId: rawId, success: false, error: err.message })
                }
            }
        } else if (bot.platform === 'TELEGRAM') {
            if (!bot.apiToken) return res.status(503).json({ error: 'Telegram API token missing.' })
            
            for (const chatId of parsedChatIds) {
                try {
                    if (req.file && mediaType === 'image') {
                        const formData = new FormData();
                        formData.append('chat_id', chatId);
                        if (text) formData.append('caption', text);
                        
                        const fileData = typeof Blob !== 'undefined' 
                            ? new Blob([fs.readFileSync(filePath)], { type: req.file.mimetype })
                            : fs.createReadStream(filePath);
                        formData.append('photo', fileData, req.file.originalname);
                        
                        const response = await fetch(`https://api.telegram.org/bot${bot.apiToken}/sendPhoto`, {
                            method: 'POST',
                            body: formData
                        });
                        if (!response.ok) throw new Error(await response.text());
                    } else if (req.file && mediaType === 'video') {
                        const formData = new FormData();
                        formData.append('chat_id', chatId);
                        if (text) formData.append('caption', text);
                        
                        const fileData = typeof Blob !== 'undefined' 
                            ? new Blob([fs.readFileSync(filePath)], { type: req.file.mimetype })
                            : fs.createReadStream(filePath);
                        formData.append('video', fileData, req.file.originalname);
                        
                        const response2 = await fetch(`https://api.telegram.org/bot${bot.apiToken}/sendVideo`, {
                            method: 'POST',
                            body: formData
                        });
                        if (!response2.ok) throw new Error(await response2.text());
                    } else if (req.file && mediaType === 'audio') {
                        const formData = new FormData();
                        formData.append('chat_id', chatId);
                        if (text) formData.append('caption', text);
                        
                        const isOgg = req.file.mimetype.includes('ogg');
                        const fieldName = isOgg ? 'voice' : 'audio';
                        const method = isOgg ? 'sendVoice' : 'sendAudio';
                        
                        const fileData = typeof Blob !== 'undefined' 
                            ? new Blob([fs.readFileSync(filePath)], { type: req.file.mimetype })
                            : fs.createReadStream(filePath);
                        formData.append(fieldName, fileData, req.file.originalname);
                        
                        const response = await fetch(`https://api.telegram.org/bot${bot.apiToken}/${method}`, {
                            method: 'POST',
                            body: formData
                        });
                        if (!response.ok) throw new Error(await response.text());
                    } else if (req.file && mediaType === 'document') {
                        const formData = new FormData();
                        formData.append('chat_id', chatId);
                        if (text) formData.append('caption', text);
                        
                        const fileData = typeof Blob !== 'undefined' 
                            ? new Blob([fs.readFileSync(filePath)], { type: req.file.mimetype })
                            : fs.createReadStream(filePath);
                        formData.append('document', fileData, req.file.originalname);
                        
                        const response = await fetch(`https://api.telegram.org/bot${bot.apiToken}/sendDocument`, {
                            method: 'POST',
                            body: formData
                        });
                        if (!response.ok) throw new Error(await response.text());
                    } else {
                        await callTelegramAPI('sendMessage', bot.apiToken, {
                            chat_id: chatId,
                            text: text || ''
                        });
                    }

                    const savedMsg = await prisma.message.create({
                        data: { botId, sender: 'bot', text: text || '', chatId: chatId, mediaUrl, mediaType }
                    })
                    io.emit(`chat-${botId}`, savedMsg)
                    results.push({ chatId, success: true })

                    await new Promise(r => setTimeout(r, 500)) // Rate limit for Telegram
                } catch (err) {
                    results.push({ chatId, success: false, error: err.message })
                }
            }
        }

        res.json({ success: true, results })
    } catch (e) { res.status(500).json({ error: e.message }) }
})

// POST resume AI for a specific chat (was paused per-chat before, kept for compat)
router.post('/bot/:id/resume', requireAuth, requireBotOwnership, async (req, res) => {
    try {
        const prisma = getPrisma()
        const botId = Number(req.params.id)
        const { chatId } = req.body

        const bot = await prisma.bot.findUnique({ where: { id: botId } })
        if (!bot) return res.status(404).json({ error: 'Bot not found' })

        const pausedChats = (bot.pausedChats || []).filter(c => c !== chatId)
        await prisma.bot.update({ where: { id: botId }, data: { pausedChats } })

        res.json({ success: true })
    } catch (e) { res.status(500).json({ error: e.message }) }
})

// Legacy Baileys QR pairing. WhatsApp now connects through Meta Embedded Signup
// (POST /api/integrations/whatsapp/connect); services/whatsapp.js no longer exists.
router.post('/bot/:id/connect', async (req, res) => {
    res.status(410).json({
        error: 'QR pairing has been replaced by WhatsApp Cloud API. Connect the number via "Подключить WhatsApp" in the channel settings.'
    })
})
// НОВЫЙ РОУТ ДЛЯ РУЧНОЙ ПРИВЯЗКИ НОМЕРА К LID
router.post('/bot/:id/link-lid', requireAuth, requireBotOwnership, async (req, res) => {
    const { id } = req.params;
    const { lid, jid } = req.body;
    
    try {
        const prisma = getPrisma()
        // Переносим все сообщения
        await prisma.message.updateMany({
            where: { botId: Number(id), chatId: lid },
            data: { chatId: jid }
        });
        
        // Обновляем контакт
        await prisma.contact.upsert({
            where: { botId_chatId: { botId: Number(id), chatId: lid } },
            update: { realJid: jid },
            create: { botId: Number(id), chatId: lid, realJid: jid, name: 'Contact' }
        });
        
        res.json({ success: true });
    } catch (err) {
        console.error('Error linking lid:', err);
        res.status(500).json({ error: 'Failed to link lid' });
    }
})
// ── TELEGRAM WEBHOOK ──────────────────────────────────────
router.post('/webhook/telegram/:slug', async (req, res) => {
    // Send immediate 200 OK so Telegram doesn't retry
    res.status(200).send('OK')

    try {
        const prisma = getPrisma()
        const slug = req.params.slug

        // Support both Channel slugs (new) and legacy Bot slugs (backward compat)
        let bot = null
        let channel = null

        // Try Channel slug first (new multi-channel system)
        channel = await prisma.channel.findUnique({
            where: { slug },
            include: { bot: true }
        })

        if (channel && channel.isActive && channel.platform === 'TELEGRAM') {
            bot = channel.bot
        } else {
            // Fallback: legacy Bot slug
            bot = await prisma.bot.findUnique({ where: { slug } })
            if (!bot || !bot.isActive || bot.platform !== 'TELEGRAM') return
            channel = null // legacy mode
        }

        const update = req.body
        const message = update.message || update.edited_message || update.callback_query?.message || update.channel_post;
        
        if (!message) return

        let text = message.text || message.caption || '';
        let telegramAudioBuffer = null;
        let mimeType = null;
        let mediaUrl = null;
        let mediaType = null;

        const tokenToUse = channel ? channel.apiToken : bot.apiToken

        if (message.voice || message.audio) {
            const fileId = message.voice?.file_id || message.audio?.file_id;
            try {
                const fileData = await fetch(`https://api.telegram.org/bot${tokenToUse}/getFile?file_id=${fileId}`).then(r=>r.json());
                if (fileData.ok) {
                    const filePath = fileData.result.file_path;
                    const audioRes = await fetch(`https://api.telegram.org/file/bot${tokenToUse}/${filePath}`);
                    const arrayBuffer = await audioRes.arrayBuffer();
                    telegramAudioBuffer = Buffer.from(arrayBuffer);
                    mimeType = message.voice?.mime_type || message.audio?.mime_type || 'audio/ogg';
                    
                    const ext = filePath.split('.').pop() || 'ogg';
                    const filename = `tg_audio_${Date.now()}_${Math.floor(Math.random()*1000)}.${ext}`;
                    const localPath = path.join(__dirname, '../../uploads', filename);
                    fs.writeFileSync(localPath, telegramAudioBuffer);
                    
                    mediaUrl = `/uploads/${filename}`;
                    mediaType = 'audio';
                    const audioTag = `[AUDIO]/uploads/${filename}`;
                    text = text ? `${text}\n${audioTag}` : audioTag;
                }
            } catch(e) { console.error('Telegram Audio error', e) }
        } else if (message.photo) {
            const photoArray = message.photo;
            const fileId = photoArray[photoArray.length - 1].file_id;
            try {
                const fileData = await fetch(`https://api.telegram.org/bot${tokenToUse}/getFile?file_id=${fileId}`).then(r=>r.json());
                if (fileData.ok) {
                    const filePath = fileData.result.file_path;
                    const fileRes = await fetch(`https://api.telegram.org/file/bot${tokenToUse}/${filePath}`);
                    const arrayBuffer = await fileRes.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);
                    
                    const ext = filePath.split('.').pop() || 'jpg';
                    const filename = `tg_image_${Date.now()}_${Math.floor(Math.random()*1000)}.${ext}`;
                    const localPath = path.join(__dirname, '../../uploads', filename);
                    fs.writeFileSync(localPath, buffer);
                    
                    mediaUrl = `/uploads/${filename}`;
                    mediaType = 'image';
                }
            } catch(e) { console.error('Telegram Photo error', e) }
        } else if (message.video || message.video_note) {
            const videoObj = message.video || message.video_note;
            const fileId = videoObj.file_id;
            try {
                const fileData = await fetch(`https://api.telegram.org/bot${tokenToUse}/getFile?file_id=${fileId}`).then(r=>r.json());
                if (fileData.ok) {
                    const filePath = fileData.result.file_path;
                    const fileRes = await fetch(`https://api.telegram.org/file/bot${tokenToUse}/${filePath}`);
                    const arrayBuffer = await fileRes.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);
                    
                    const ext = filePath.split('.').pop() || 'mp4';
                    const filename = `tg_video_${Date.now()}_${Math.floor(Math.random()*1000)}.${ext}`;
                    const localPath = path.join(__dirname, '../../uploads', filename);
                    fs.writeFileSync(localPath, buffer);
                    
                    mediaUrl = `/uploads/${filename}`;
                    mediaType = 'video';
                }
            } catch(e) { console.error('Telegram Video error', e) }
        } else if (message.document) {
            const fileId = message.document.file_id;
            const originalName = message.document.file_name || 'document';
            try {
                const fileData = await fetch(`https://api.telegram.org/bot${tokenToUse}/getFile?file_id=${fileId}`).then(r=>r.json());
                if (fileData.ok) {
                    const filePath = fileData.result.file_path;
                    const fileRes = await fetch(`https://api.telegram.org/file/bot${tokenToUse}/${filePath}`);
                    const arrayBuffer = await fileRes.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);
                    
                    let ext = path.extname(originalName) || '';
                    if (!ext) {
                        ext = filePath.split('.').pop() || '';
                        if (ext) ext = '.' + ext;
                    }
                    const cleanBaseName = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
                    const filename = `tg_doc_${Date.now()}_${cleanBaseName}${ext}`;
                    const localPath = path.join(__dirname, '../../uploads', filename);
                    fs.writeFileSync(localPath, buffer);
                    
                    mediaUrl = `/uploads/${filename}`;
                    mediaType = 'document';
                    if (!text) {
                        text = originalName;
                    }
                }
            } catch(e) { console.error('Telegram Document error', e) }
        }

        if (!text && !telegramAudioBuffer && !mediaUrl) return

        const telegramChatId = message.chat.id.toString()
        let senderName = 'Telegram User'
        if (message.from) {
            const { first_name, last_name, username } = message.from
            const fullName = [first_name, last_name].filter(Boolean).join(' ')
            if (fullName && username) {
                senderName = `${fullName} (@${username})`
            } else if (username) {
                senderName = `@${username}`
            } else {
                senderName = fullName || `User ${update.message.from.id}`
            }
        }

        const io = req.app.get('io')

        // 1. Update/create Contact
        let contact = await prisma.contact.findUnique({ where: { botId_chatId: { botId: bot.id, chatId: telegramChatId } } })
        if (!contact) {
            contact = await prisma.contact.create({ data: { botId: bot.id, chatId: telegramChatId, name: senderName } })
            io.emit(`contact-update-${bot.id}`, contact)
        } else if (contact.name !== senderName) {
            contact = await prisma.contact.update({ where: { botId_chatId: { botId: bot.id, chatId: telegramChatId } }, data: { name: senderName } })
            io.emit(`contact-update-${bot.id}`, contact)
        }

        // 2. Save user message (with platform tag)
        const userMsg = await prisma.message.create({
            data: { 
                botId: bot.id, 
                channelId: channel?.id || null,
                platform: 'TELEGRAM',
                sender: 'user', 
                text, 
                chatId: telegramChatId,
                mediaUrl,
                mediaType
            }
        })
        io.emit(`chat-${bot.id}`, { ...userMsg, platform: 'TELEGRAM' })

        // If bot is paused for this chat, don't reply
        // Re-read from DB to get the freshest pausedChats (avoid stale data from parallel requests)
        const freshBotState = await prisma.bot.findUnique({ where: { id: bot.id }, select: { isActive: true, pausedChats: true } });
        if (!freshBotState?.isActive) return;
        
        if (channel) {
            const freshChannelState = await prisma.channel.findUnique({ where: { id: channel.id }, select: { isActive: true } });
            if (!freshChannelState?.isActive) return;
        }

        if ((freshBotState.pausedChats || []).includes(telegramChatId)) return;

        // 3. Check if user has messages remaining
        const canProceed = await hasEnoughMessages(bot.user_id)
        if (!canProceed) {
            try {
                const ownerUser = await prisma.user.findUnique({
                    where: { id: bot.user_id },
                    select: { email: true, name: true }
                });
                await prisma.bot.update({ where: { id: bot.id }, data: { isActive: false } });
                io.emit(`bot-update-${bot.id}`, { isActive: false });
                if (ownerUser?.email) {
                    const { sendBalanceExhaustedEmail } = await import('../services/emailService.js');
                    await sendBalanceExhaustedEmail(ownerUser.email, ownerUser.name, bot.name || `Bot #${bot.id}`);
                }
            } catch (e) { console.error('Error on balance exhausted:', e); }
            return
        }

        // 4. Query AI (Gemini Flash-Lite)
        const recentMessages = await prisma.message.findMany({
            where: { botId: bot.id, chatId: telegramChatId },
            orderBy: { createdAt: 'desc' },
            take: 20
        })
        
        let systemInstruction = `${bot.system_prompt || ''}\n\nCRITICAL: Follow the system instructions exactly. Pay extreme attention to any [Correction] or [IMPORTANT CORRECTION] tags at the end of the instructions.`;

        // Setup integration config
        const integrationConfig = {
            googleSheetUrl: bot.googleSheetUrl,
            googleSheetColumns: bot.googleSheetColumns,
            bitrixWebhookUrl: bot.bitrixWebhookUrl,
            googleCalendarId: bot.googleCalendarId
        };
        const ragContext = bot.data_prompt || '';

        const reversed = [...recentMessages].reverse()
        const history = reversed.slice(0, -1).map(msg => ({
            role: msg.sender === 'bot' ? 'model' : 'user',
            parts: [{ text: msg.text }]
        }));
        const userMessage = reversed.length > 0 ? reversed[reversed.length - 1].text : '';

        let aiResponseText = "Sorry, AI service is temporarily unavailable.";
        let inputTokens = 0;
        let outputTokens = 0;

        try {
            const geminiResult = await generateGeminiResponse(
                userMessage, 
                history, 
                systemInstruction, 
                ragContext, 
                telegramAudioBuffer, 
                mimeType,
                integrationConfig
            );
            aiResponseText = geminiResult.text;
            inputTokens = geminiResult.inputTokens;
            outputTokens = geminiResult.outputTokens;
            
            if (geminiResult.shouldPauseChat) {
                let pausedChats = bot.pausedChats || [];
                if (!pausedChats.includes(telegramChatId)) {
                    pausedChats.push(telegramChatId);
                    await prisma.bot.update({
                        where: { id: bot.id },
                        data: { pausedChats }
                    });
                }
                try {
                    const contact = await prisma.contact.update({
                        where: { botId_chatId: { botId: bot.id, chatId: telegramChatId } },
                        data: { status: 'Нужен ответ' }
                    });
                    io.emit(`contact-update-${bot.id}`, contact);
                    io.emit(`bot-update-${bot.id}`, { pausedChats });
                } catch(e) {}
            }

            // 5. Track usage
            await trackUsage({
                userId: bot.user_id,
                botId: bot.id,
                provider: 'vertex-ai',
                inputTokens,
                outputTokens,
                model: geminiResult.model,
            })
            console.log(`[Telegram Bot ${bot.id}] Gemini usage: in=${inputTokens} out=${outputTokens}`)
        } catch (error) {
            console.error(`[Telegram Bot ${bot.id}] Gemini AI Error:`, error.message);
            aiResponseText = "Error connecting to AI. Gemini integration is temporarily unavailable.";
        }

        // 6. Send message back to Telegram
        if (aiResponseText && aiResponseText.trim()) {
            await callTelegramAPI('sendMessage', tokenToUse, {
                chat_id: telegramChatId,
                text: cleanTelegramText(aiResponseText)
            })

            // 7. Save bot reply (with platform tag)
            const botMsg = await prisma.message.create({
                data: { 
                    botId: bot.id, 
                    channelId: channel?.id || null,
                    platform: 'TELEGRAM',
                    sender: 'bot', 
                    text: aiResponseText, 
                    chatId: telegramChatId 
                }
            })
            io.emit(`chat-${bot.id}`, { ...botMsg, platform: 'TELEGRAM' })
        }

        if (geminiResult && geminiResult.filesToSend && geminiResult.filesToSend.length > 0) {
            for (const fileUrl of geminiResult.filesToSend) {
                try {
                    const fs = await import('fs');
                    const path = await import('path');
                    const { fileURLToPath } = await import('url');
                    const __dirnameTmp = path.dirname(fileURLToPath(import.meta.url)).replace(/^\/([a-zA-Z]:)/, '$1');
                    const filename = fileUrl.split('/').pop();
                    const filePath = path.join(__dirnameTmp, '../../uploads', filename);
                    
                    if (fs.existsSync(filePath)) {
                        const formData = new FormData();
                        formData.append('chat_id', telegramChatId);
                        
                        let method = 'sendDocument';
                        let fieldName = 'document';
                        let mediaType = 'document';
                        
                        if (filename.endsWith('.jpg') || filename.endsWith('.jpeg') || filename.endsWith('.png')) {
                            method = 'sendPhoto';
                            fieldName = 'photo';
                            mediaType = 'image';
                        } else if (filename.endsWith('.mp4')) {
                            method = 'sendVideo';
                            fieldName = 'video';
                            mediaType = 'video';
                        }
                        
                        const fileData = typeof Blob !== 'undefined' 
                            ? new Blob([fs.readFileSync(filePath)])
                            : fs.createReadStream(filePath);
                            
                        formData.append(fieldName, fileData, filename);
                        
                        const response = await fetch(`https://api.telegram.org/bot${tokenToUse}/${method}`, {
                            method: 'POST',
                            body: formData
                        });
                        
                        if (response.ok) {
                            const botMsg = await prisma.message.create({
                                data: { 
                                    botId: bot.id, 
                                    channelId: channel?.id || null,
                                    platform: 'TELEGRAM',
                                    sender: 'bot', 
                                    text: '', 
                                    chatId: telegramChatId,
                                    mediaUrl: fileUrl,
                                    mediaType
                                }
                            })
                            io.emit(`chat-${bot.id}`, { ...botMsg, platform: 'TELEGRAM' })
                        }
                    }
                } catch(e) {
                    console.error(`[Telegram Bot ${bot.id}] Error sending file ${fileUrl}:`, e);
                }
            }
        }

    } catch (e) {
        console.error('Telegram webhook processing error:', e)
    }
})


// ── INSTAGRAM WEBHOOK (GLOBAL) ──────────────────────────────

const igAccountToConfigMap = new Map(); // instagram_business_account_id -> { bot, channel }

/**
 * A platform account id (Instagram account, WhatsApp phone number) must resolve to exactly
 * one bot, or inbound webhooks get answered with the wrong tenant's prompts. Meta allows an
 * account to be moved between owners, which leaves the previous owner's row pointing at the
 * same id — so on every (re)connect, strip the id from everyone else.
 */
async function claimInstagramAccountId(accountId, { channelId = null, botId = null } = {}) {
    if (!accountId) return
    const prisma = getPrisma()
    await prisma.channel.updateMany({
        where: { instagramUserId: accountId, ...(channelId ? { id: { not: channelId } } : {}) },
        data: { instagramUserId: null }
    })
    await prisma.bot.updateMany({
        where: { instagramUserId: accountId, ...(botId ? { id: { not: botId } } : {}) },
        data: { instagramUserId: null }
    })
}
export { claimInstagramAccountId }

async function getChannelByInstagramAccountId(accountId) {
    const prisma = getPrisma();
    
    // 1. Check cache — but re-verify against the DB that the entry still belongs to THIS
    //    account id. A channel reconnected to a different Instagram account would otherwise
    //    keep answering for the previous owner, using the wrong bot's prompts.
    if (igAccountToConfigMap.has(accountId)) {
        const cached = igAccountToConfigMap.get(accountId);
        if (cached.channel) {
            const channel = await prisma.channel.findUnique({ where: { id: cached.channel.id }, include: { bot: true } });
            if (channel && channel.instagramUserId === accountId && channel.isActive && channel.bot.isActive) {
                return { bot: channel.bot, channel };
            }
        } else {
            const bot = await prisma.bot.findUnique({ where: { id: cached.bot.id } });
            if (bot && bot.instagramUserId === accountId && bot.isActive) {
                return { bot, channel: null };
            }
        }
        igAccountToConfigMap.delete(accountId);
    }

    // 2. Direct database lookup by instagramUserId
    const exactChannel = await prisma.channel.findFirst({
        where: { instagramUserId: accountId, platform: 'INSTAGRAM', isActive: true },
        include: { bot: true }
    });
    if (exactChannel && exactChannel.bot.isActive) {
        return { bot: exactChannel.bot, channel: exactChannel };
    }

    const exactBot = await prisma.bot.findFirst({
        where: { instagramUserId: accountId, platform: 'INSTAGRAM', isActive: true }
    });
    if (exactBot) {
        return { bot: exactBot, channel: null };
    }

    // 3. Fetch active Instagram channels (Fallback to Graph API if no instagramUserId)
    const activeChannels = await prisma.channel.findMany({
        where: { platform: 'INSTAGRAM', isActive: true },
        include: { bot: true }
    });

    for (const channel of activeChannels) {
        if (!channel.bot.isActive || !channel.apiToken) continue;
        try {
            const response = await fetch(`https://graph.facebook.com/v21.0/me?fields=instagram_business_account&access_token=${channel.apiToken}`);
            if (response.ok) {
                const data = await response.json();
                const igId = data.instagram_business_account?.id;
                if (igId) {
                    // Persist what the token proved, so step 2 resolves it directly next time
                    // instead of re-scanning every tenant's channel on each message.
                    if (channel.instagramUserId !== igId) {
                        await claimInstagramAccountId(igId, { channelId: channel.id, botId: channel.botId })
                        await prisma.channel.update({ where: { id: channel.id }, data: { instagramUserId: igId } })
                        channel.instagramUserId = igId
                    }
                    igAccountToConfigMap.set(igId, { bot: channel.bot, channel });
                    if (igId === accountId) {
                        return { bot: channel.bot, channel };
                    }
                }
            }
        } catch (e) {
            console.error(`[Instagram] Error fetching IG ID for channel ${channel.id}:`, e.message);
        }
    }

    // 3. Fallback: Legacy active Instagram bots
    const activeBots = await prisma.bot.findMany({
        where: { platform: 'INSTAGRAM', isActive: true }
    });

    for (const bot of activeBots) {
        if (!bot.apiToken) continue;
        try {
            const response = await fetch(`https://graph.facebook.com/v21.0/me?fields=instagram_business_account&access_token=${bot.apiToken}`);
            if (response.ok) {
                const data = await response.json();
                const igId = data.instagram_business_account?.id;
                if (igId) {
                    if (bot.instagramUserId !== igId) {
                        await claimInstagramAccountId(igId, { botId: bot.id })
                        await prisma.bot.update({ where: { id: bot.id }, data: { instagramUserId: igId } })
                        bot.instagramUserId = igId
                    }
                    igAccountToConfigMap.set(igId, { bot, channel: null });
                    if (igId === accountId) {
                        return { bot, channel: null };
                    }
                }
            }
        } catch (e) {
            console.error(`[Instagram] Error fetching IG ID for bot ${bot.id}:`, e.message);
        }
    }

    // NEVER guess. Falling back to "the first active bot" answers this account's customer
    // with a DIFFERENT TENANT's system_prompt and data_prompt, files the conversation under
    // their bot, and bills their message balance. Dropping the message is the safe failure.
    console.warn(`[Instagram] No bot is connected to Instagram account ${accountId} — message ignored. Reconnect the account so instagramUserId is stored.`);
    return null;
}

// ── WHATSAPP CLOUD API ────────────────────────────────────────

// NOTE: deliberately NOT cached. isActive has to be read fresh on every webhook so that
// switching a bot off in the UI takes effect immediately. The channel is returned even when
// inactive so inbound messages still land in the inbox — the caller decides whether to reply.
async function getChannelByWhatsAppPhoneNumberId(phoneNumberId) {
    const prisma = getPrisma();
    const channel = await prisma.channel.findFirst({
        where: { whatsappPhoneNumberId: phoneNumberId },
        orderBy: { updatedAt: 'desc' },
        include: { bot: true }
    });
    if (channel) {
        return { bot: channel.bot, channel };
    }
    return null;
}

router.post('/integrations/whatsapp/connect', requireAuth, async (req, res) => {
    try {
        const { code, botId } = req.body;
        console.log(`[WA-CONNECT] request for bot ${botId} from user ${req.session.userId}, code present: ${!!code}`);
        if (!code || !botId) return res.status(400).json({ error: 'Code and botId are required' });

        const prisma = getPrisma();
        const bot = await prisma.bot.findUnique({ where: { id: Number(botId), user_id: req.session.userId } });
        if (!bot) return res.status(404).json({ error: 'Bot not found' });

        const { exchangeCodeForToken, getWabaAndPhone, registerPhone, subscribeWabaToWebhook, syncSmbAppData } = await import('../services/whatsapp-cloud.js');
        
        // 1. Exchange the code for the customer's **business integration system user token**.
        //    Despite the variable name this is not a short-lived user token: Meta's docs say
        //    Tech Providers use business tokens exclusively, and this is the only credential
        //    that actually carries access to *this customer's* WABA.
        const userAccessToken = await exchangeCodeForToken(code);
        
        console.log(`[WA-CONNECT] token exchange ok, length ${userAccessToken?.length}`);

        // 2. Get WABA and Phone Number IDs from the token scopes
        const { wabaId, phoneNumberId } = await getWabaAndPhone(userAccessToken);
        console.log(`[WA-CONNECT] resolved wabaId=${wabaId} phoneNumberId=${phoneNumberId}`);
        
        // 3. Skip registerPhone — Embedded Signup auto-registers the number.
        //    Calling /register manually forces full migration and breaks Coexistence
        //    (user would have to delete WhatsApp from their phone).
        console.log(`[WhatsApp Cloud] Skipping manual phone registration (Embedded Signup handles it). Phone: ${phoneNumberId}`);
        
        // 4. Subscribe WABA to our app's webhooks
        await subscribeWabaToWebhook(wabaId);
        
        // Store the customer's business token as the channel credential. Our own
        // WA_SYSTEM_USER_TOKEN only has access to WABAs our business portfolio owns, so it
        // works for our own test number and will fail for a real customer's WABA. The send
        // paths already fall back to WA_SYSTEM_USER_TOKEN when a channel has no token.
        const systemToken = userAccessToken || process.env.WA_SYSTEM_USER_TOKEN;

        // 5. Save to DB.
        // First release this phone number from any other bot that still claims it — a number
        // can be moved between businesses (and Meta test numbers get reused constantly). A
        // leftover row would make the webhook resolve to the wrong tenant's bot, answering
        // with their system_prompt/data_prompt and spending their message balance.
        let channel = await prisma.channel.findFirst({ where: { botId: bot.id, platform: 'WHATSAPP' } });
        const stale = await prisma.channel.updateMany({
            where: {
                whatsappPhoneNumberId: phoneNumberId,
                ...(channel ? { id: { not: channel.id } } : {})
            },
            data: { whatsappPhoneNumberId: null, whatsappWabaId: null, isActive: false }
        });
        if (stale.count > 0) {
            console.warn(`[WhatsApp Cloud] Released phone number ${phoneNumberId} from ${stale.count} previously connected channel(s).`);
        }

        if (channel) {
            channel = await prisma.channel.update({
                where: { id: channel.id },
                data: {
                    apiToken: systemToken,
                    whatsappWabaId: wabaId,
                    whatsappPhoneNumberId: phoneNumberId,
                    isActive: true
                }
            });
        } else {
            channel = await prisma.channel.create({
                data: {
                    botId: bot.id,
                    platform: 'WHATSAPP',
                    apiToken: systemToken,
                    whatsappWabaId: wabaId,
                    whatsappPhoneNumberId: phoneNumberId,
                    isActive: true,
                    slug: `wa_${bot.id}_${Date.now()}`
                }
            });
        }
        
        // Also activate the bot itself
        await prisma.bot.update({ where: { id: bot.id }, data: { isActive: true } });

        // 6. Coexistence only: pull in the contacts and chat history that already exist in
        //    the owner's WhatsApp Business app. Meta allows each sync exactly once per
        //    onboarding, and the data arrives later as `smb_app_state_sync` / `history`
        //    webhooks. A number that isn't a Coexistence number, or an owner who declined
        //    to share history, makes these fail — which must not fail the whole connect,
        //    since the channel above is already saved and working.
        for (const syncType of ['smb_app_state_sync', 'history']) {
            try {
                await syncSmbAppData(phoneNumberId, syncType, systemToken);
            } catch (syncErr) {
                console.warn(`[WhatsApp Cloud] ${syncType} sync unavailable for ${phoneNumberId}: ${syncErr.message}`);
            }
        }

        res.json({ success: true, channel });
    } catch (e) {
        console.error('WhatsApp Connect error:', e);
        res.status(500).json({ error: e.message });
    }
});

// GET — WhatsApp Cloud webhook verification
router.get('/webhook/whatsapp-cloud', async (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const expectedToken = process.env.WA_WEBHOOK_VERIFY_TOKEN || 'up_chat_wa_verify_9k2m4';

    if (mode === 'subscribe' && token === expectedToken) {
        console.log(`[WhatsApp Cloud] Webhook verified successfully.`);
        return res.status(200).send(challenge);
    }
    console.warn(`[WhatsApp Cloud] Webhook verification FAILED. token=${token}`);
    return res.sendStatus(403);
});

// ── Coexistence webhook handlers ────────────────────────────────────────────
// With Coexistence the business keeps using WhatsApp on their phone while the number is
// also on the Cloud API, so Meta reports three extra event types. None of them may reach
// the AI reply path: they describe messages that were *already sent*, so answering them
// would make the bot reply to itself, deduct from the owner's balance, and loop.

/**
 * `smb_message_echoes` — the owner sent a message from their own phone (or a companion
 * device). Stored as sender:'bot' so the shared inbox and the AI's history stay complete.
 *
 * Deduped on the wamid: when the operator sends from up-chat, that message is saved by the
 * send route *and* echoed back here, which would otherwise show twice in the transcript and
 * halve the effective context window (history is the last 20 rows).
 */
async function handleSmbMessageEchoes(value, io) {
    const prisma = getPrisma();
    const phoneNumberId = value?.metadata?.phone_number_id;
    const echoes = value?.message_echoes || [];
    if (!phoneNumberId || echoes.length === 0) return;

    const config = await getChannelByWhatsAppPhoneNumberId(phoneNumberId);
    if (!config) {
        console.log(`[WhatsApp Echo] No bot for phone_number_id: ${phoneNumberId}`);
        return;
    }
    const { bot, channel } = config;

    for (const echo of echoes) {
        // `to` is the customer — `from` is the business's own number, so it must not be
        // used as chatId or every outbound message would land in one bogus thread.
        const chatId = echo.to;
        const wamid = echo.id;
        if (!chatId || !wamid) continue;

        const already = await prisma.message.findFirst({
            where: { botId: bot.id, waMessageId: wamid },
            select: { id: true }
        });
        if (already) continue;

        const text = echo.text?.body || echo[echo.type]?.caption || '';
        const mediaType = waTypeToMediaTypeSafe(echo.type);
        // Echo media is referenced by id only. Storing the text/type keeps the transcript
        // readable; downloading the bytes is a separate concern and not attempted here.
        const storedText = text || (mediaType ? `[${mediaType}]` : '');
        if (!storedText) continue;

        const msg = await prisma.message.create({
            data: {
                botId: bot.id,
                channelId: channel.id,
                platform: 'WHATSAPP',
                sender: 'bot',
                text: storedText,
                chatId,
                mediaType,
                waMessageId: wamid
            }
        });
        io.emit(`chat-${bot.id}`, msg);
        console.log(`[WhatsApp Echo] Stored owner message to ${chatId} (bot ${bot.id})`);
    }
}

/**
 * `smb_app_state_sync` — the business's WhatsApp contacts. Arrives after the one-time
 * sync request at connect, and again whenever they add/edit/remove a contact on the phone.
 */
async function handleSmbAppStateSync(value, io) {
    const prisma = getPrisma();
    const phoneNumberId = value?.metadata?.phone_number_id;
    const entries = value?.state_sync || [];
    if (!phoneNumberId || entries.length === 0) return;

    const config = await getChannelByWhatsAppPhoneNumberId(phoneNumberId);
    if (!config) {
        console.log(`[WhatsApp StateSync] No bot for phone_number_id: ${phoneNumberId}`);
        return;
    }
    const { bot } = config;

    for (const item of entries) {
        if (item.type !== 'contact') continue;
        const chatId = item.contact?.phone_number;
        if (!chatId) continue;

        // 'remove' only means they deleted it from their phonebook — the conversation and
        // its messages stay. Renaming to the raw number keeps the thread intact.
        const name = item.action === 'remove'
            ? `WA User ${chatId}`
            : (item.contact.full_name || item.contact.first_name || `WA User ${chatId}`);

        const contact = await prisma.contact.upsert({
            where: { botId_chatId: { botId: bot.id, chatId } },
            update: { name },
            create: { botId: bot.id, chatId, name }
        });
        io.emit(`contact-update-${bot.id}`, contact);
    }
    console.log(`[WhatsApp StateSync] Synced ${entries.length} contact change(s) for bot ${bot.id}`);
}

/**
 * `history` — past conversations from the business's phone, delivered as a series of
 * webhooks after the one-time sync request.
 *
 * Meta's docs describe the payload as message threads but do not pin down the field names,
 * and media arrives as a placeholder followed by a second webhook. So this reads the shape
 * defensively and logs anything it doesn't recognise rather than guessing — check the log
 * after the first real sync and tighten it to whatever actually arrives.
 */
async function handleHistorySync(value, io) {
    const prisma = getPrisma();
    const phoneNumberId = value?.metadata?.phone_number_id;
    if (!phoneNumberId) return;

    // Documented failure: the business declined to share their history.
    const errors = value?.errors || value?.history?.errors;
    if (Array.isArray(errors) && errors.some(e => String(e.code) === '2593109')) {
        console.log(`[WhatsApp History] Business declined history sharing for ${phoneNumberId}.`);
        return;
    }

    const config = await getChannelByWhatsAppPhoneNumberId(phoneNumberId);
    if (!config) {
        console.log(`[WhatsApp History] No bot for phone_number_id: ${phoneNumberId}`);
        return;
    }
    const { bot, channel } = config;

    const threads = value?.history?.[0]?.threads || value?.history?.threads || value?.threads;
    if (!Array.isArray(threads)) {
        console.warn('[WhatsApp History] Unrecognised payload shape — nothing imported. Raw value:',
            JSON.stringify(value).slice(0, 2000));
        return;
    }

    let imported = 0;
    for (const thread of threads) {
        const chatId = thread.id || thread.wa_id || thread.contact_id;
        if (!chatId) continue;

        for (const m of (thread.messages || [])) {
            const wamid = m.id;
            if (!wamid) continue;

            const already = await prisma.message.findFirst({
                where: { botId: bot.id, waMessageId: wamid },
                select: { id: true }
            });
            if (already) continue;

            const text = m.text?.body || m[m.type]?.caption || '';
            const mediaType = waTypeToMediaTypeSafe(m.type);
            const storedText = text || (mediaType ? `[${mediaType}]` : '');
            if (!storedText) continue;

            // `from` equal to the business number means the owner wrote it.
            const isFromBusiness = m.from && value.metadata.display_phone_number
                && String(m.from).replace(/\D/g, '') === String(value.metadata.display_phone_number).replace(/\D/g, '');

            await prisma.message.create({
                data: {
                    botId: bot.id,
                    channelId: channel.id,
                    platform: 'WHATSAPP',
                    sender: isFromBusiness ? 'bot' : 'user',
                    text: storedText,
                    chatId,
                    mediaType,
                    waMessageId: wamid,
                    // Imported conversations must keep their real timestamps, otherwise the
                    // whole history stacks up at "now" and the transcript order is wrong.
                    ...(m.timestamp ? { createdAt: new Date(Number(m.timestamp) * 1000) } : {})
                }
            });
            imported++;
        }

        const existingContact = await prisma.contact.findUnique({
            where: { botId_chatId: { botId: bot.id, chatId } }
        });
        if (!existingContact) {
            const contact = await prisma.contact.create({
                data: { botId: bot.id, chatId, name: thread.name || `WA User ${chatId}` }
            });
            io.emit(`contact-update-${bot.id}`, contact);
        }
    }

    if (imported > 0) {
        io.emit(`chat-${bot.id}`, { historyImported: imported });
        console.log(`[WhatsApp History] Imported ${imported} message(s) for bot ${bot.id}`);
    }
}

/** waTypeToMediaType without importing the module on every echo. */
function waTypeToMediaTypeSafe(waType) {
    switch (waType) {
        case 'image':
        case 'sticker': return 'image';
        case 'audio':
        case 'voice': return 'audio';
        case 'video': return 'video';
        case 'document': return 'document';
        default: return null;
    }
}

// POST — WhatsApp Cloud incoming messages
router.post('/webhook/whatsapp-cloud', async (req, res) => {
    res.status(200).send('EVENT_RECEIVED'); // Always respond 200 immediately

    try {
        const body = req.body;
        console.log(`[WhatsApp Cloud Webhook] 📥 Received payload from ${req.ip}`);
        console.log(JSON.stringify(body, null, 2));

        if (body.object !== 'whatsapp_business_account') {
            console.log(`[WhatsApp Cloud Webhook] ❌ Ignored object type: ${body.object}`);
            return;
        }

        const io = req.app.get('io');
        const prisma = getPrisma();

        for (const entry of (body.entry || [])) {
            for (const change of (entry.changes || [])) {
                // Coexistence events describe messages that already went out. They are
                // stored for the inbox and then dropped — never fed to the AI reply path
                // below, which would answer our own message and bill the owner for it.
                if (change.field === 'smb_message_echoes') {
                    try { await handleSmbMessageEchoes(change.value, io); }
                    catch (e) { console.error('[WhatsApp Echo] handler failed:', e); }
                    continue;
                }
                if (change.field === 'smb_app_state_sync') {
                    try { await handleSmbAppStateSync(change.value, io); }
                    catch (e) { console.error('[WhatsApp StateSync] handler failed:', e); }
                    continue;
                }
                if (change.field === 'history') {
                    try { await handleHistorySync(change.value, io); }
                    catch (e) { console.error('[WhatsApp History] handler failed:', e); }
                    continue;
                }

                if (change.field !== 'messages') continue;
                const value = change.value;
                if (!value || !value.messages || value.messages.length === 0) continue;

                const phoneNumberId = value.metadata.phone_number_id;
                const messageObj = value.messages[0];
                const senderId = messageObj.from;

                if (!phoneNumberId || !senderId) continue;

                const config = await getChannelByWhatsAppPhoneNumberId(phoneNumberId);
                if (!config) {
                    console.log(`[WhatsApp Cloud] Bot not found for phone_number_id: ${phoneNumberId}`);
                    continue;
                }
                const { bot, channel } = config;
                const tokenToUse = channel.apiToken || process.env.WA_SYSTEM_USER_TOKEN;

                // ── Resolve text + media ────────────────────────────────
                // Media arrives as an id only; it has to be downloaded from the Graph API
                // and mirrored into /uploads so the operator UI can render it.
                let messageText = messageObj.text?.body || messageObj[messageObj.type]?.caption || '';
                let mediaUrl = null;
                let mediaType = null;
                let waAudioBuffer = null;
                let waAudioMime = null;

                const { downloadWhatsAppMedia, waTypeToMediaType } = await import('../services/whatsapp-cloud.js');
                const resolvedMediaType = waTypeToMediaType(messageObj.type);

                if (resolvedMediaType) {
                    const mediaNode = messageObj[messageObj.type];
                    const mediaId = mediaNode?.id;
                    if (mediaId) {
                        try {
                            const { buffer, mimeType } = await downloadWhatsAppMedia(mediaId, tokenToUse);

                            const originalName = mediaNode.filename || '';
                            // Extension is attacker-controlled (sender-supplied filename) — keep only
                            // word chars so it can never influence the path we write to.
                            let ext = originalName ? path.extname(originalName).replace(/[^\w.]/g, '') : '';
                            if (!ext || ext === '.') {
                                const subtype = String(mimeType).split(';')[0].split('/')[1] || 'bin';
                                ext = '.' + (subtype === 'jpeg' ? 'jpg' : subtype).replace(/[^\w]/g, '');
                            }
                            const prefixMap = { image: 'wa_image', audio: 'wa_audio', video: 'wa_video', document: 'wa_doc' };
                            const filename = `${prefixMap[resolvedMediaType]}_${Date.now()}_${Math.floor(Math.random() * 1000)}${ext}`;
                            fs.writeFileSync(path.join(__dirname, '../../uploads', filename), buffer);

                            mediaUrl = `/uploads/${filename}`;
                            mediaType = resolvedMediaType;

                            if (resolvedMediaType === 'audio') {
                                // Let Gemini actually listen to the voice note, and keep an [AUDIO]
                                // marker in the transcript so history is never empty (mirrors Telegram).
                                waAudioBuffer = buffer;
                                waAudioMime = String(mimeType).split(';')[0].trim();
                                const audioTag = `[AUDIO]${mediaUrl}`;
                                messageText = messageText ? `${messageText}\n${audioTag}` : audioTag;
                            } else if (resolvedMediaType === 'document' && !messageText) {
                                messageText = originalName || 'Документ';
                            }
                        } catch (mediaErr) {
                            console.error(`[WhatsApp Bot ${bot.id}] Media download failed (${messageObj.type}):`, mediaErr.message);
                        }
                    }
                }

                // Unsupported payloads (reactions, system notices) carry nothing to store.
                if (!messageText && !mediaUrl) {
                    console.log(`[WhatsApp Bot ${bot.id}] Skipping unsupported message type: ${messageObj.type}`);
                    continue;
                }

                console.log(`[WhatsApp Bot ${bot.id}] Message from ${senderId} (${messageObj.type}): ${messageText}`);

                // 1. Upsert Contact
                let contact = await prisma.contact.findUnique({ where: { botId_chatId: { botId: bot.id, chatId: senderId } } });
                if (!contact) {
                    const contactInfo = value.contacts?.find(c => c.wa_id === senderId);
                    const waName = contactInfo?.profile?.name || `WA User ${senderId}`;
                    contact = await prisma.contact.create({ data: { botId: bot.id, chatId: senderId, name: waName } });
                    io.emit(`contact-update-${bot.id}`, contact);
                }

                // 2. Save user message.
                // Meta redelivers a webhook it considers unacknowledged, and with Coexistence
                // the same message can also arrive through the history sync — so store the
                // wamid and skip anything already recorded rather than duplicating the thread.
                if (messageObj.id) {
                    const duplicate = await prisma.message.findFirst({
                        where: { botId: bot.id, waMessageId: messageObj.id },
                        select: { id: true }
                    });
                    if (duplicate) {
                        console.log(`[WhatsApp Bot ${bot.id}] Duplicate message ${messageObj.id} ignored.`);
                        continue;
                    }
                }

                const userMsg = await prisma.message.create({
                    data: { botId: bot.id, channelId: channel.id, platform: 'WHATSAPP', sender: 'user', text: messageText, chatId: senderId, mediaUrl, mediaType, waMessageId: messageObj.id || null }
                });
                io.emit(`chat-${bot.id}`, userMsg);

                // Re-read state fresh: the bot/channel may have been switched off after this
                // webhook started, and `bot`/`channel` above are a snapshot. The message stays
                // in the inbox either way — only the AI auto-reply is suppressed.
                const freshBot = await prisma.bot.findUnique({
                    where: { id: bot.id },
                    select: { isActive: true, pausedChats: true }
                });
                if (!freshBot?.isActive) {
                    console.log(`[WhatsApp Bot ${bot.id}] Bot is OFF — message stored, no auto-reply.`);
                    continue;
                }

                const freshChannel = await prisma.channel.findUnique({
                    where: { id: channel.id },
                    select: { isActive: true }
                });
                if (!freshChannel?.isActive) {
                    console.log(`[WhatsApp Bot ${bot.id}] Channel ${channel.id} is OFF — message stored, no auto-reply.`);
                    continue;
                }

                // Skip if chat is paused (handed off to a human operator)
                if ((freshBot.pausedChats || []).includes(senderId)) continue;

                // 3. Check balance
                const canProceed = await hasEnoughMessages(bot.user_id);
                if (!canProceed) {
                    try {
                        const ownerUser = await prisma.user.findUnique({
                            where: { id: bot.user_id },
                            select: { email: true, name: true }
                        });
                        await prisma.channel.update({ where: { id: channel.id }, data: { isActive: false } });
                        io.emit(`bot-update-${bot.id}`, { isActive: false });
                        if (ownerUser?.email) {
                            const { sendBalanceExhaustedEmail } = await import('../services/emailService.js');
                            await sendBalanceExhaustedEmail(ownerUser.email, ownerUser.name, bot.name || `Bot #${bot.id}`);
                        }
                    } catch (e) { console.error('Error on balance exhausted:', e); }
                    continue;
                }

                // 4. Build history
                const recentMessages = await prisma.message.findMany({
                    where: { botId: bot.id, chatId: senderId },
                    orderBy: { createdAt: 'desc' },
                    take: 20
                });
                const reversed = [...recentMessages].reverse();
                const history = reversed.slice(0, -1).map(m => ({
                    role: m.sender === 'bot' ? 'model' : 'user',
                    parts: [{ text: m.text }]
                }));
                const userMessage = reversed.length > 0 ? reversed[reversed.length - 1].text : messageText;

                // 5. Call Gemini
                let aiResponseText = 'Извините, AI временно недоступен.';
                let inputTokens = 0, outputTokens = 0;
                try {
                    let sysInstruction = `${bot.system_prompt || ''}\n\nCRITICAL: Follow the system instructions exactly. Pay extreme attention to any [Correction] or [IMPORTANT CORRECTION] tags at the end of the instructions.`;

                    const integrationConfig = {
                        googleSheetUrl: bot.googleSheetUrl,
                        googleSheetColumns: bot.googleSheetColumns,
                        bitrixWebhookUrl: bot.bitrixWebhookUrl,
                        googleCalendarId: bot.googleCalendarId
                    };
                    const geminiResult = await generateGeminiResponse(
                        userMessage,
                        history,
                        sysInstruction,
                        bot.data_prompt || '',
                        waAudioBuffer,
                        waAudioMime,
                        integrationConfig
                    );
                    aiResponseText = geminiResult.text;
                    inputTokens = geminiResult.inputTokens;
                    outputTokens = geminiResult.outputTokens;

                    if (geminiResult.shouldPauseChat) {
                        let pausedChats = freshBot.pausedChats || [];
                        if (!pausedChats.includes(senderId)) {
                            pausedChats.push(senderId);
                            await prisma.bot.update({
                                where: { id: bot.id },
                                data: { pausedChats }
                            });
                        }
                        aiResponseText = geminiResult.text + '\n\n*Чат переведён на менеджера*';
                    }

                    // Deduct balance
                    if (inputTokens > 0 || outputTokens > 0) {
                        await trackUsage({
                            userId: bot.user_id,
                            botId: bot.id,
                            provider: 'vertex-ai',
                            model: geminiResult.model,
                            inputTokens,
                            outputTokens
                        });
                    }
                } catch (e) {
                    console.error(`[WhatsApp Bot ${bot.id}] Gemini Error:`, e);
                }

                // 6. Send reply via WhatsApp Cloud. Only persist it if it actually left —
                //    otherwise the operator sees a reply the customer never received.
                let replySent = false;
                let replyWamid = null;
                try {
                    const { sendWhatsAppCloudMessage } = await import('../services/whatsapp-cloud.js');
                    const sendResult = await sendWhatsAppCloudMessage(phoneNumberId, senderId, aiResponseText, tokenToUse);
                    // Keep the wamid: with Coexistence this same message comes back as an
                    // smb_message_echo, and the echo handler skips ids we already stored.
                    replyWamid = sendResult?.messages?.[0]?.id || null;
                    replySent = true;
                } catch (e) {
                    console.error(`[WhatsApp Bot ${bot.id}] Failed to send reply:`, e.message);
                }

                // 7. Save bot message
                if (replySent) {
                    const botMsg = await prisma.message.create({
                        data: { botId: bot.id, channelId: channel.id, platform: 'WHATSAPP', sender: 'bot', text: aiResponseText, chatId: senderId, waMessageId: replyWamid }
                    });
                    io.emit(`chat-${bot.id}`, botMsg);
                }
            }
        }
    } catch (e) {
        console.error('WhatsApp Webhook error:', e);
    }
});

// ── INSTAGRAM API ────────────────────────────────────────
router.get('/webhook/instagram', async (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const expectedToken = process.env.IG_WEBHOOK_VERIFY_TOKEN || 'up_chat_verify_8f3a2k9';

    if (mode === 'subscribe' && token === expectedToken) {
        console.log(`[Instagram] Global webhook verified successfully.`);
        return res.status(200).send(challenge);
    }
    console.warn(`[Instagram] Webhook verification FAILED. token=${token}`);
    return res.sendStatus(403);
});

// POST — incoming Instagram messages (Global)
router.post('/webhook/instagram', async (req, res) => {
    // Always respond 200 immediately so Meta doesn't retry
    res.status(200).send('EVENT_RECEIVED');

    try {
        const body = req.body;
        console.log('[Instagram Webhook] Received payload:', JSON.stringify(body, null, 2));
        
        if (body.object !== 'instagram' && body.object !== 'page') {
            console.log(`[Instagram] Ignoring payload with object: ${body.object}`);
            return;
        }

        const io = req.app.get('io');
        const prisma = getPrisma();

        for (const entry of (body.entry || [])) {
            const recipientId = entry.id; // Instagram Account ID receiving the message
            if (!recipientId) continue;

            const config = await getChannelByInstagramAccountId(recipientId);
            if (!config) {
                console.log(`[Instagram] Active bot not found for Instagram Business Account: ${recipientId}`);
                continue;
            }
            const { bot, channel } = config;
            const tokenToUse = channel ? channel.apiToken : bot.apiToken;

            for (const messagingEvent of (entry.messaging || [])) {
                // Skip delivery / read receipts / echo messages
                if (!messagingEvent.message || messagingEvent.message.is_echo) continue;

                const senderId = messagingEvent.sender?.id?.toString();
                const messageText = messagingEvent.message?.text || '';

                if (!senderId || !messageText) continue;

                console.log(`[Instagram Bot ${bot.id}] Message from ${senderId}: ${messageText}`);

                // 1. Upsert Contact
                let contact = await prisma.contact.findUnique({ where: { botId_chatId: { botId: bot.id, chatId: senderId } } });
                if (!contact) {
                    let igName = `Instagram User ${senderId}`;
                    try {
                        const profileRes = await fetch(`https://graph.facebook.com/v21.0/${senderId}?fields=name,username&access_token=${tokenToUse}`);
                        if (profileRes.ok) {
                            const profileData = await profileRes.json();
                            if (profileData.username) {
                                igName = `@${profileData.username}`;
                                if (profileData.name) igName += ` (${profileData.name})`;
                            } else if (profileData.name) {
                                igName = profileData.name;
                            }
                        }
                    } catch (e) {
                        console.error(`[Instagram] Failed to fetch profile for ${senderId}:`, e.message);
                    }
                    contact = await prisma.contact.create({ data: { botId: bot.id, chatId: senderId, name: igName } });
                    io.emit(`contact-update-${bot.id}`, contact);
                }

                // 2. Save user message
                const userMsg = await prisma.message.create({
                    data: { botId: bot.id, channelId: channel?.id || null, platform: 'INSTAGRAM', sender: 'user', text: messageText, chatId: senderId }
                });
                io.emit(`chat-${bot.id}`, userMsg);

                // Re-read state fresh: `bot`/`channel` come from igAccountToConfigMap, which is
                // never invalidated, so a bot switched off in the UI would otherwise keep replying.
                const freshIgBot = await prisma.bot.findUnique({
                    where: { id: bot.id },
                    select: { isActive: true, pausedChats: true }
                });
                if (!freshIgBot?.isActive) {
                    console.log(`[Instagram Bot ${bot.id}] Bot is OFF — message stored, no auto-reply.`);
                    continue;
                }
                if (channel) {
                    const freshIgChannel = await prisma.channel.findUnique({
                        where: { id: channel.id },
                        select: { isActive: true }
                    });
                    if (!freshIgChannel?.isActive) {
                        console.log(`[Instagram Bot ${bot.id}] Channel ${channel.id} is OFF — message stored, no auto-reply.`);
                        continue;
                    }
                }

                // Skip if chat is paused
                if ((freshIgBot.pausedChats || []).includes(senderId)) continue;

                // 3. Check balance
                const canProceed = await hasEnoughMessages(bot.user_id);
                if (!canProceed) {
                    try {
                        const ownerUser = await prisma.user.findUnique({
                            where: { id: bot.user_id },
                            select: { email: true, name: true }
                        });
                        await prisma.bot.update({ where: { id: bot.id }, data: { isActive: false } });
                        io.emit(`bot-update-${bot.id}`, { isActive: false });
                        if (ownerUser?.email) {
                            const { sendBalanceExhaustedEmail } = await import('../services/emailService.js');
                            await sendBalanceExhaustedEmail(ownerUser.email, ownerUser.name, bot.name || `Bot #${bot.id}`);
                        }
                    } catch (e) { console.error('Error on balance exhausted:', e); }
                    continue;
                }

                // 4. Build history
                const recentMessages = await prisma.message.findMany({
                    where: { botId: bot.id, chatId: senderId },
                    orderBy: { createdAt: 'desc' },
                    take: 20
                });
                const reversed = [...recentMessages].reverse();
                const history = reversed.slice(0, -1).map(m => ({
                    role: m.sender === 'bot' ? 'model' : 'user',
                    parts: [{ text: m.text }]
                }));
                const userMessage = reversed.length > 0 ? reversed[reversed.length - 1].text : messageText;

                // 5. Call Gemini
                let aiResponseText = 'Извините, AI временно недоступен.';
                let inputTokens = 0, outputTokens = 0;
                try {
                    let sysInstruction = `${bot.system_prompt || ''}\n\nCRITICAL: Follow the system instructions exactly. Pay extreme attention to any [Correction] or [IMPORTANT CORRECTION] tags at the end of the instructions.`;

                    const integrationConfig = {
                        googleSheetUrl: bot.googleSheetUrl,
                        googleSheetColumns: bot.googleSheetColumns,
                        bitrixWebhookUrl: bot.bitrixWebhookUrl,
                        googleCalendarId: bot.googleCalendarId
                    };
                    const geminiResult = await generateGeminiResponse(
                        userMessage, 
                        history, 
                        sysInstruction, 
                        bot.data_prompt || '', 
                        null, 
                        null, 
                        integrationConfig
                    );
                    aiResponseText = geminiResult.text;
                    inputTokens = geminiResult.inputTokens;
                    outputTokens = geminiResult.outputTokens;
                    
                    if (geminiResult.shouldPauseChat) {
                        let pausedChats = bot.pausedChats || [];
                        if (!pausedChats.includes(senderId)) {
                            pausedChats.push(senderId);
                            await prisma.bot.update({
                                where: { id: bot.id },
                                data: { pausedChats }
                            });
                        }
                        try {
                            const contact = await prisma.contact.update({
                                where: { botId_chatId: { botId: bot.id, chatId: senderId } },
                                data: { status: 'Нужен ответ' }
                            });
                            io.emit(`contact-update-${bot.id}`, contact);
                            io.emit(`bot-update-${bot.id}`, { pausedChats });
                        } catch(e) {}
                    }

                    await trackUsage({
                        userId: bot.user_id, botId: bot.id,
                        provider: 'vertex-ai', inputTokens, outputTokens, model: geminiResult.model
                    });
                    console.log(`[Instagram Bot ${bot.id}] Gemini usage: in=${inputTokens} out=${outputTokens}`);
                } catch (err) {
                    console.error(`[Instagram Bot ${bot.id}] Gemini Error:`, err.message);
                }

                // 6. Send reply via Instagram Graph API
                await sendInstagramMessage(tokenToUse, senderId, aiResponseText);

                // 7. Save bot reply
                const botMsg = await prisma.message.create({
                    data: { botId: bot.id, channelId: channel?.id || null, platform: 'INSTAGRAM', sender: 'bot', text: aiResponseText, chatId: senderId }
                });
                io.emit(`chat-${bot.id}`, botMsg);
            }
        }
    } catch (e) {
        console.error('[Instagram] Webhook processing error:', e);
    }
});

async function sendInstagramMessage(pageAccessToken, recipientId, text) {
    if (!pageAccessToken) {
        console.error('[Instagram] No page access token configured');
        return;
    }
    let res = await fetch(`https://graph.instagram.com/v21.0/me/messages?access_token=${pageAccessToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            recipient: { id: recipientId },
            message: { text }
        })
    });
    if (!res.ok) {
        res = await fetch(`https://graph.facebook.com/v21.0/me/messages?access_token=${pageAccessToken}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                recipient: { id: recipientId },
                message: { text }
            })
        });
    }
    if (!res.ok) {
        const errText = await res.text();
        console.error(`[Instagram] sendMessage failed:`, errText);
    }
}

// POST — manually re-subscribe Instagram bot page to webhook events
router.post('/bot/:id/instagram-subscribe', requireAuth, async (req, res) => {
    try {
        const prisma = getPrisma();
        const bot = await prisma.bot.findUnique({ where: { id: Number(req.params.id), user_id: req.session.userId } });
        if (!bot) return res.status(404).json({ error: 'Bot not found' });
        if (bot.platform !== 'INSTAGRAM') return res.status(400).json({ error: 'Not an Instagram bot' });
        if (!bot.apiToken) return res.status(400).json({ error: 'No API token set' });

        // Get Page ID
        const meRes = await fetch(`https://graph.facebook.com/v21.0/me?access_token=${bot.apiToken}`);
        const meData = await meRes.json();
        if (meData.error) return res.status(400).json({ error: 'Invalid token', detail: meData.error.message });

        const pageId = meData.id;

        // Subscribe page to messages
        const subRes = await fetch(`https://graph.facebook.com/v21.0/${pageId}/subscribed_apps`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                subscribed_fields: ['messages', 'messaging_postbacks'],
                access_token: bot.apiToken
            })
        });
        const subData = await subRes.json();
        console.log(`[Instagram] Manual subscribe for bot ${bot.id} page ${pageId}:`, JSON.stringify(subData));
        return res.json({ pageId, subscriptionResult: subData });
    } catch (e) {
        console.error('[Instagram] Subscribe error:', e);
        res.status(500).json({ error: e.message });
    }
});

router.post('/bot/:id/upload-pdf', requireAuth, requireBotOwnership, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
        const botId = req.params.id;
        const parser = new pdfParse.PDFParse(new Uint8Array(req.file.buffer))
        const result = await parser.getText()
        
        // Save file to disk so AI can send it later
        const fs = await import('fs');
        const path = await import('path');
        const __dirnameTmp = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([a-zA-Z]:)/, '$1');
        const ext = path.extname(req.file.originalname) || '.pdf';
        const cleanBaseName = path.basename(req.file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
        const filename = `bot_${botId}_kb_${Date.now()}_${cleanBaseName}${ext}`;
        const filePath = path.join(__dirnameTmp, '../../uploads', filename);
        fs.writeFileSync(filePath, req.file.buffer);
        const fileUrl = `/uploads/${filename}`;
        
        res.json({ text: result.text, fileUrl })
    } catch (e) { 
        console.error('PDF Upload Error:', e)
        res.status(500).json({ error: e.message }) 
    }
})

router.post('/bot/:id/agent-chat', requireAuth, async (req, res) => {
    try {
        const { text, history } = req.body
        const prisma = getPrisma()
        const botId = Number(req.params.id)
        const bot = await prisma.bot.findUnique({ where: { id: botId, user_id: req.session.userId } })
        if (!bot) return res.status(404).json({ error: 'Bot not found' })

        const systemInstruction = `You are an expert AI configuration agent. Your task is to update the system prompt and data prompt for a bot based on user requests.
Current system_prompt:
${bot.system_prompt}

Current data_prompt (knowledge base):
${bot.data_prompt}

The user will ask you to change the bot's behavior or add knowledge. 
Respond with a JSON object ONLY, in this exact format:
{
  "reply": "Your message to the user explaining what you changed.",
  "new_system_prompt": "The complete updated system prompt",
  "new_data_prompt": "The complete updated data prompt"
}

CRITICAL RULES FOR new_system_prompt:
1. When the user asks you to change how the bot behaves or speaks, you MUST append this instruction clearly at the end of the new_system_prompt. 
2. Use strong language like "[IMPORTANT CORRECTION]: " to make sure the bot follows it.
3. PRESERVE ALL existing instructions in the system_prompt, just add the new ones at the end. DO NOT replace the whole prompt with just the new rule.

CRITICAL RULES FOR new_data_prompt:
You MUST format new_data_prompt EXACTLY like this with these specific headers, otherwise the system will break.
IMPORTANT: If you do not have real information for a section (e.g., no real links, no real FAQ, no real manager contact), leave it completely blank. DO NOT hallucinate fake data, fake links (like example.com), or fake phone numbers.

Компания:
[Name]

Описание:
[Description]

Преимущества:
[Benefits]

Цены и условия:
[Pricing]

FAQ:
[Leave blank if no real FAQ provided by user]

Полезные ссылки:
[Leave blank if no real links provided]

Контакт менеджера:
[Leave blank if no real contact provided]

Дополнительная информация:
[Append any large unstructured text, rules, or knowledge provided by the user here exactly as they provided it. DO NOT omit any details they pasted!]

Ensure the output is strictly valid JSON. Do not add markdown blocks around JSON.
CRITICAL: If the user pastes a huge text with company details or prices, you MUST include ALL of it under the "Дополнительная информация" or appropriate sections. Do not summarize it too shortly. Preserve the details.`;

        const geminiHistory = [];
        if (history) {
           for(const h of history) {
               geminiHistory.push({ role: h.role === 'assistant' ? 'model' : 'user', parts: [{ text: h.content }] });
           }
        }
        const userMessage = text;

        let content = "{}";
        try {
            const geminiResult = await generateAgentResponse(userMessage, geminiHistory, systemInstruction);
            content = geminiResult.text;
            console.log("Agent Chat Gemini Response:", content.substring(0, 300));
        } catch (error) {
            console.error("Agent Chat Gemini Error:", error);
            content = JSON.stringify({
                reply: "Error connecting to AI. Please try again later.",
                new_system_prompt: bot.system_prompt,
                new_data_prompt: bot.data_prompt
            });
        }
        
        let parsed = { reply: "Я не смог обработать ваш запрос.", new_system_prompt: bot.system_prompt, new_data_prompt: bot.data_prompt }
        
        try {
            // Strip markdown block if model added it
            content = content.replace(/```json/g, '').replace(/```/g, '').trim();
            parsed = JSON.parse(content)
        } catch (e) {
            const match = content.match(/\{[\s\S]*\}/)
            if (match) {
                try {
                    parsed = JSON.parse(match[0])
                } catch (err) {}
            }
        }

        const replyMsg = parsed.reply || "Готово. Изменения применены.";

        if (parsed.new_system_prompt || parsed.new_data_prompt) {
            const finalSysPrompt = typeof parsed.new_system_prompt === 'object' ? JSON.stringify(parsed.new_system_prompt, null, 2) : (parsed.new_system_prompt || bot.system_prompt);
            const finalDataPrompt = typeof parsed.new_data_prompt === 'object' ? JSON.stringify(parsed.new_data_prompt, null, 2) : (parsed.new_data_prompt || bot.data_prompt);

            await prisma.bot.update({
                where: { id: botId },
                data: {
                    system_prompt: finalSysPrompt,
                    data_prompt: finalDataPrompt
                }
            })
            
            parsed.new_system_prompt = finalSysPrompt;
            parsed.new_data_prompt = finalDataPrompt;
        }

        res.json({ reply: replyMsg, system_prompt: parsed.new_system_prompt, data_prompt: parsed.new_data_prompt })
    } catch (e) {
        console.error('Agent chat error:', e)
        res.status(500).json({ error: e.message })
    }
})

// ── TEST CHAT ──────────────────────────────────────────────
router.post('/bot/:id/test-chat', requireAuth, async (req, res) => {
    try {
        const { text, history } = req.body
        const prisma = getPrisma()
        const botId = Number(req.params.id)
        const bot = await prisma.bot.findUnique({ where: { id: botId, user_id: req.session.userId } })
        if (!bot) return res.status(404).json({ error: 'Bot not found' })

        const systemInstruction = `${bot.system_prompt || ''}\n\nCRITICAL: Follow the system instructions exactly. Pay extreme attention to any [Correction] or [IMPORTANT CORRECTION] tags at the end of the instructions.`;
        const ragContext = bot.data_prompt || '';

        const geminiHistory = [];
        if (history) {
           for(const h of history) {
               geminiHistory.push({ role: h.role === 'assistant' ? 'model' : 'user', parts: [{ text: h.content }] });
           }
        }
        const userMessage = text;

        let content = "Извините, не удалось сформировать ответ.";
        try {
            const geminiResult = await generateGeminiResponse(userMessage, geminiHistory, systemInstruction, ragContext);
            content = geminiResult.text;
        } catch (error) {
            console.error("Test Chat Gemini Error:", error);
            content = "Ошибка подключения к ИИ. Пожалуйста, проверьте настройки.";
        }
        
        res.json({ reply: content })
    } catch (e) {
        console.error('Test chat error:', e)
        res.status(500).json({ error: e.message })
    }
})

// ── PUBLIC TEST CHAT FOR LANDING PAGE ─────────────────────────
router.post('/public-test-chat', async (req, res) => {
    try {
        const { system_prompt, text, history } = req.body
        if (!text) return res.status(400).json({ error: 'Message text is required' })

        const systemInstruction = system_prompt || 'Ты AI-консультант.'
        const ragContext = ''

        const geminiHistory = [];
        if (history) {
           for(const h of history) {
               geminiHistory.push({ role: h.role === 'assistant' ? 'model' : 'user', parts: [{ text: h.content }] });
           }
        }
        const userMessage = text;

        let content = "Извините, не удалось сформировать ответ.";
        try {
            const geminiResult = await generateGeminiResponse(userMessage, geminiHistory, systemInstruction, ragContext);
            content = geminiResult.text;
        } catch (error) {
            console.error("Public Test Chat Gemini Error:", error);
            content = "Ошибка подключения к ИИ. Пожалуйста, попробуйте еще раз.";
        }
        
        res.json({ reply: content })
    } catch (e) {
        console.error('Public test chat error:', e)
        res.status(500).json({ error: e.message })
    }
})

// ── CHAT PAUSE / RESUME ────────────────────────────────────
router.post('/bot/:id/chat/pause', requireAuth, async (req, res) => {
    try {
        const prisma = getPrisma()
        const botId = Number(req.params.id)
        const { chatId } = req.body

        const bot = await prisma.bot.findUnique({ where: { id: botId, user_id: req.session.userId } })
        if (!bot) return res.status(404).json({ error: 'Bot not found' })

        const pausedChats = new Set(bot.pausedChats || [])
        pausedChats.add(chatId)
        
        await prisma.bot.update({ 
            where: { id: botId }, 
            data: { pausedChats: Array.from(pausedChats) } 
        })

        res.json({ success: true, paused: true })
    } catch (e) { res.status(500).json({ error: e.message }) }
})

router.post('/bot/:id/chat/resume', requireAuth, async (req, res) => {
    try {
        const prisma = getPrisma()
        const botId = Number(req.params.id)
        const { chatId } = req.body

        const bot = await prisma.bot.findUnique({ where: { id: botId, user_id: req.session.userId } })
        if (!bot) return res.status(404).json({ error: 'Bot not found' })

        const pausedChats = (bot.pausedChats || []).filter(c => c !== chatId)
        await prisma.bot.update({ 
            where: { id: botId }, 
            data: { pausedChats } 
        })

        res.json({ success: true, paused: false })
    } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── SUPPORT TICKETS ────────────────────────────────────────
router.post('/support', async (req, res) => {
    const { name, email, message } = req.body;
    if (!name || !email || !message) return res.status(400).json({ error: 'All fields are required' });
    try {
        const prisma = getPrisma();
        console.log(`[Support Ticket] From: ${name} <${email}>\n${message}`);
        await prisma.supportTicket.create({
            data: { name, email, message }
        });
        res.json({ success: true });
    } catch (e) {
        console.error('Support route error:', e);
        res.status(500).json({ error: e.message });
    }
});

export default router
