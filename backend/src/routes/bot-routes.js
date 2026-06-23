import express from 'express'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pkgPg from 'pg'
const { Pool } = pkgPg
import { requireAuth } from '../middleware/auth.js'
import { trackUsage, hasEnoughMessages } from '../services/usage-tracker.js'
import { generateGeminiResponse } from '../services/GeminiService.js';
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

// ── BOTS ────────────────────────────────────────────────

// GET stats
router.get('/stats', async (req, res) => {
    try {
        const prisma = getPrisma()
        // Here we could filter by user_id if we had auth, but for now we'll count all bot messages
        const messageCount = await prisma.message.count({
            where: { sender: 'bot' }
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

        // Auto-start WhatsApp bot after creation
        if (platform === 'WHATSAPP') {
            const { startWhatsAppBot } = await import('../services/whatsapp.js')
            startWhatsAppBot(bot, getPrisma(), io).catch(err => {
                console.error(`[WhatsApp Bot ${bot.id}] Failed to start:`, err)
            })
        }
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
                const { stopWhatsAppBot } = await import('../services/whatsapp.js')
                await stopWhatsAppBot(botId, true)
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
            // Only hide if the session directory was also deleted (meaning it was explicitly disconnected)
            const { default: fs } = await import('fs');
            const { default: path } = await import('path');
            const { fileURLToPath } = await import('url');
            const __dirnameTmp = path.dirname(fileURLToPath(import.meta.url));
            const sessionDir = path.join(__dirnameTmp, `../../sessions/session_${botId}`);
            if (!fs.existsSync(sessionDir)) {
                isBaseChannelDeleted = true;
            }
        }
        
        const allChannels = [
            ...((hasChannelForBotPlatform || isBaseChannelDeleted) ? [] : [{
                id: 'base-' + bot.id,
                platform: bot.platform,
                isActive: bot.isActive,
                slug: bot.slug,
                botId: bot.id,
                isBaseChannel: true
            }]),
            ...channels
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

        // WhatsApp - start QR scan flow
        if (platform === 'WHATSAPP') {
            const { startWhatsAppChannel } = await import('../services/whatsapp.js')
            startWhatsAppChannel(channel, bot, getPrisma(), io).catch(err => {
                console.error(`[WhatsApp Channel ${channel.id}] Failed to start:`, err)
            })
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
                try {
                    const { stopWhatsAppBot } = await import('../services/whatsapp.js')
                    await stopWhatsAppBot(botId, true)
                } catch (e) {}
                // Delete session directory so the channel card disappears on next page load
                try {
                    const fsModule = await import('fs');
                    const pathModule = await import('path');
                    const urlModule = await import('url');
                    const __dirnameTmp = pathModule.default.dirname(urlModule.fileURLToPath(import.meta.url));
                    const sessionDir = pathModule.default.join(__dirnameTmp, `../../sessions/session_${botId}`);
                    if (fsModule.default.existsSync(sessionDir)) {
                        fsModule.default.rmSync(sessionDir, { recursive: true, force: true });
                        console.log(`[WhatsApp Base Bot ${botId}] Session directory deleted.`);
                    }
                } catch (e) {
                    console.error(`[WhatsApp Base Bot ${botId}] Failed to delete session dir:`, e.message);
                }
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
            try {
                const { stopWhatsAppChannel, stopWhatsAppBot } = await import('../services/whatsapp.js')
                await stopWhatsAppChannel(channelId, true)
                // Fix ghost channel bug: also aggressively destroy any legacy bot session
                await stopWhatsAppBot(botId, true).catch(e => {})
            } catch (e) {}
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
                    const { startWhatsAppBot } = await import('../services/whatsapp.js')
                    startWhatsAppBot(updated, getPrisma(), io).catch(e => {})
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
                    const { stopWhatsAppBot } = await import('../services/whatsapp.js')
                    await stopWhatsAppBot(botId, false).catch(e => {})
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
            const { startWhatsAppChannel } = await import('../services/whatsapp.js')
            startWhatsAppChannel(channel, bot, getPrisma(), io).catch(e => {})
        } else if (channel.isActive && channel.platform === 'WHATSAPP') {
            const { stopWhatsAppChannel } = await import('../services/whatsapp.js')
            await stopWhatsAppChannel(channelId).catch(e => {})
        }

        res.json(updated)
    } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── BOT STATUS / PAUSE ───────────────────────────────────

// POST /api/bot/:id/pause — полностью останавливает бота (isActive = false + отключает сокет)
router.post('/bot/:id/pause', async (req, res) => {
    try {
        const prisma = getPrisma()
        const botId = Number(req.params.id)

        const bot = await prisma.bot.update({
            where: { id: botId },
            data: { isActive: false }
        })

        // Disconnect WhatsApp socket
        if (bot.platform === 'WHATSAPP') {
            try {
                const { stopWhatsAppBot } = await import('../services/whatsapp.js')
                await stopWhatsAppBot(botId, false)
            } catch (e) {}
        }

        res.json({ success: true, isActive: false })
    } catch (e) { res.status(500).json({ error: e.message }) }
})

// POST /api/bot/:id/start — запускает бота (isActive = true + reconnect)
router.post('/bot/:id/start', async (req, res) => {
    try {
        const prisma = getPrisma()
        const io = req.app.get('io')
        const botId = Number(req.params.id)

        const bot = await prisma.bot.update({
            where: { id: botId },
            data: { isActive: true }
        })

        if (bot.platform === 'WHATSAPP') {
            const { startWhatsAppBot } = await import('../services/whatsapp.js')
            startWhatsAppBot(bot, getPrisma(), io)
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
router.get('/bot/:id/messages', async (req, res) => {
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
router.get('/bot/:id/chats', async (req, res) => {
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
router.post('/bot/:id/contact/name', async (req, res) => {
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
router.post('/bot/:id/contact/delete', async (req, res) => {
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
router.get('/bot/:id/chat', async (req, res) => {
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
router.post('/bot/:id/chat/delete', async (req, res) => {
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
router.post('/bot/:id/send', upload.single('file'), async (req, res) => {
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
            } else if (req.file.mimetype.startsWith('audio/')) {
                mediaType = 'audio';
            } else {
                mediaType = 'document';
            }
        }

        // Find last message to determine channel and platform
        const lastMsg = await prisma.message.findFirst({
            where: { botId, chatId: rawChatId },
            orderBy: { createdAt: 'desc' }
        })

        const platform = lastMsg?.platform || bot.platform;
        let channelId = lastMsg?.channelId || null;
        let apiToken = bot.apiToken;

        if (channelId) {
            const channel = await prisma.channel.findUnique({ where: { id: channelId } });
            if (channel) {
                apiToken = channel.apiToken || apiToken;
            }
        }

        let chatId = rawChatId;
        if (platform === 'WHATSAPP') {
            chatId = rawChatId.includes('@') ? rawChatId : `${rawChatId}@s.whatsapp.net`;
            const { getWhatsAppSession, startWhatsAppBot, startWhatsAppChannel } = await import('../services/whatsapp.js');
            const sessionId = channelId ? `ch_${channelId}` : botId;
            let sock = getWhatsAppSession(sessionId);
            
            if (!sock) {
                // Auto-reconnect: try to restart the session
                console.log(`[Send] Session ${sessionId} not found, attempting auto-reconnect...`);
                try {
                    if (channelId) {
                        const channel = await prisma.channel.findUnique({ where: { id: channelId } });
                        if (channel) {
                            startWhatsAppChannel(channel, bot, getPrisma(), io).catch(() => {});
                        }
                    } else {
                        startWhatsAppBot(bot, getPrisma(), io).catch(() => {});
                    }
                    // Wait up to 8s for connection to establish
                    for (let i = 0; i < 8; i++) {
                        await new Promise(r => setTimeout(r, 1000));
                        sock = getWhatsAppSession(sessionId);
                        if (sock) break;
                    }
                } catch (reconnectErr) {
                    console.error(`[Send] Auto-reconnect failed:`, reconnectErr.message);
                }
            }
            
            if (!sock) return res.status(503).json({ error: 'WhatsApp session not active. Please start the bot first and wait for it to connect.' });
            
            if (req.file && mediaType === 'image') {
                await sock.sendMessage(chatId, { image: req.file.buffer, caption: text || '' });
            } else if (req.file && mediaType === 'audio') {
                await sock.sendMessage(chatId, { audio: req.file.buffer, mimetype: 'audio/mp4', ptt: true, ptv: false });
            } else if (req.file && mediaType === 'document') {
                await sock.sendMessage(chatId, { 
                    document: req.file.buffer, 
                    mimetype: req.file.mimetype, 
                    fileName: originalNameUtf8,
                    caption: text || ''
                });
            } else {
                await sock.sendMessage(chatId, { text: text || '' });
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

        // Save sent message to DB
        let textToSave = text || (req.file ? originalNameUtf8 : '');
        if (mediaType === 'audio' && !text) textToSave = '';
        const savedMsg = await prisma.message.create({
            data: { botId, channelId, platform, sender: 'bot', text: textToSave, chatId, mediaUrl, mediaType }
        })

        io.emit(`chat-${botId}`, { ...savedMsg, platform })
        res.json({ success: true, message: savedMsg })
    } catch (e) { res.status(500).json({ error: e.message }) }
})

// POST broadcast to multiple numbers
// Body: { text, chatIds: string[] }
router.post('/bot/:id/broadcast', upload.single('file'), async (req, res) => {
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
            } else if (req.file.mimetype.startsWith('audio/')) {
                mediaType = 'audio';
            } else {
                mediaType = 'document';
            }
        }

        const results = []

        if (bot.platform === 'WHATSAPP') {
            const { getWhatsAppSession } = await import('../services/whatsapp.js')
            const { safeSendMessage, broadcastDelay, shuffleArray, isActiveHour, BROADCAST_CONFIG } = await import('../services/whatsapp-antiban.js')
            const sock = getWhatsAppSession(botId)
            if (!sock) return res.status(503).json({ error: 'WhatsApp session not active' })

            // Anti-ban: shuffle recipient order so pattern is unpredictable
            const shuffledIds = shuffleArray([...parsedChatIds]);

            // Anti-ban: warn if outside active hours
            if (!isActiveHour()) {
                console.warn(`[AntiBan] ⚠️  Broadcast started outside active hours (${new Date().getHours()}:00). Proceeding with caution.`);
            }

            let msgIndex = 0;
            for (const rawId of shuffledIds) {
                if (msgIndex >= BROADCAST_CONFIG.sessionLimit) {
                    console.warn(`[AntiBan] 🛑 Session limit of ${BROADCAST_CONFIG.sessionLimit} reached. Stopping broadcast.`);
                    results.push({ chatId: rawId, success: false, error: 'Session limit reached (anti-ban)' });
                    continue;
                }

                try {
                    const jid = rawId.includes('@') ? rawId : `${rawId}@s.whatsapp.net`
                    
                    let content;
                    if (req.file && mediaType === 'image') {
                        content = { image: req.file.buffer, caption: text || '' };
                    } else if (req.file && mediaType === 'audio') {
                        content = { audio: req.file.buffer, mimetype: 'audio/mp4', ptt: true, ptv: false };
                    } else if (req.file && mediaType === 'document') {
                        content = { document: req.file.buffer, mimetype: req.file.mimetype, fileName: originalNameUtf8, caption: text || '' };
                    } else {
                        content = { text: text || '' };
                    }

                    // Anti-ban: use safeSendMessage (typing indicator + read receipt + random delays)
                    await safeSendMessage(sock, jid, content, {
                        showTyping: !req.file, // typing only for text messages
                        typingText: text || ''
                    });

                    let textToSave = text || (req.file ? originalNameUtf8 : '');
                    if (mediaType === 'audio' && !text) textToSave = '';
                    const savedMsg = await prisma.message.create({
                        data: { botId, sender: 'bot', text: textToSave, chatId: jid, mediaUrl, mediaType }
                    })
                    io.emit(`chat-${botId}`, savedMsg)
                    results.push({ chatId: jid, success: true })

                    msgIndex++;
                    // Anti-ban: wait between messages (8-25s normal, 1-3min every 15 msgs)
                    const delay = broadcastDelay(msgIndex);
                    console.log(`[AntiBan] 🕒 Waiting ${Math.round(delay/1000)}s before next recipient...`);
                    await new Promise(r => setTimeout(r, delay));

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
router.post('/bot/:id/resume', async (req, res) => {
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

// POST start QR scan for WhatsApp bot
router.post('/bot/:id/connect', async (req, res) => {
    try {
        const prisma = getPrisma()
        const io = req.app.get('io')
        const botId = Number(req.params.id)

        const bot = await prisma.bot.findUnique({ where: { id: botId } })
        if (!bot) return res.status(404).json({ error: 'Bot not found' })

        const { startWhatsAppBot } = await import('../services/whatsapp.js')
        startWhatsAppBot(bot, getPrisma(), io)

        res.json({ success: true, message: 'Bot connecting, watch for QR event' })
    } catch (e) { res.status(500).json({ error: e.message }) }
})
// НОВЫЙ РОУТ ДЛЯ РУЧНОЙ ПРИВЯЗКИ НОМЕРА К LID
router.post('/bot/:id/link-lid', async (req, res) => {
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
        if ((freshBotState.pausedChats || []).includes(telegramChatId)) return;

        // 3. Check if user has messages remaining
        const canProceed = await hasEnoughMessages(bot.user_id)
        if (!canProceed) {
            await callTelegramAPI('sendMessage', tokenToUse, {
                chat_id: telegramChatId,
                text: 'Баланс сообщений исчерпан. Пополните баланс в панели управления.'
            })
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

    } catch (e) {
        console.error('Telegram webhook processing error:', e)
    }
})


// ── INSTAGRAM WEBHOOK (GLOBAL) ──────────────────────────────

const igAccountToConfigMap = new Map(); // instagram_business_account_id -> { bot, channel }

async function getChannelByInstagramAccountId(accountId) {
    const prisma = getPrisma();
    
    // 1. Check cache
    if (igAccountToConfigMap.has(accountId)) {
        const cached = igAccountToConfigMap.get(accountId);
        if (cached.channel) {
            const channel = await prisma.channel.findUnique({ where: { id: cached.channel.id }, include: { bot: true } });
            if (channel && channel.isActive && channel.bot.isActive) return { bot: channel.bot, channel };
        } else {
            const bot = await prisma.bot.findUnique({ where: { id: cached.bot.id } });
            if (bot && bot.isActive) return { bot, channel: null };
        }
    }

    // 2. Fetch active Instagram channels
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

    if (activeChannels.length > 0) {
        console.log(`[Instagram] Fallback mapping to first active channel for account ${accountId}`);
        return { bot: activeChannels[0].bot, channel: activeChannels[0] };
    }
    if (activeBots.length > 0) {
        console.log(`[Instagram] Fallback mapping to first active legacy bot for account ${accountId}`);
        return { bot: activeBots[0], channel: null };
    }

    return null;
}

// GET — Meta webhook verification challenge (Global)
router.get('/webhook/instagram', async (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const expectedToken = process.env.INSTAGRAM_VERIFY_TOKEN || 'your_verify_token_here';

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

                // Skip if chat is paused
                if ((bot.pausedChats || []).includes(senderId)) continue;

                // 3. Check balance
                const canProceed = await hasEnoughMessages(bot.user_id);
                if (!canProceed) {
                    await sendInstagramMessage(tokenToUse, senderId, 'Баланс сообщений исчерпан. Пополните баланс в панели управления.');
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
    const res = await fetch(`https://graph.facebook.com/v21.0/me/messages?access_token=${pageAccessToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            recipient: { id: recipientId },
            message: { text }
        })
    });
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

router.post('/bot/:id/upload-pdf', requireAuth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
        const parser = new pdfParse.PDFParse(new Uint8Array(req.file.buffer))
        const result = await parser.getText()
        res.json({ text: result.text })
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
            const geminiResult = await generateGeminiResponse(userMessage, geminiHistory, systemInstruction, '');
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
