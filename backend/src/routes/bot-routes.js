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
        const { system_prompt, data_prompt, apiToken } = req.body
        
        const updateData = {};
        if (system_prompt !== undefined) updateData.system_prompt = system_prompt;
        if (data_prompt !== undefined) updateData.data_prompt = data_prompt;
        if (apiToken !== undefined) updateData.apiToken = apiToken;

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
        contacts.forEach(c => {
            if (c.name && c.name !== 'Contact') {
                contactMap.set(c.chatId, c.name)
            }
            if (c.realJid) {
                realJidMap.set(c.chatId, c.realJid)
                // Transfer name to JID so it isn't lost if messages moved to JID
                if (c.name && c.name !== 'Contact') {
                    if (!contactMap.has(c.realJid)) {
                        contactMap.set(c.realJid, c.name)
                    }
                }
            }
        })

        // Group by chatId
        const chatMap = new Map()
        for (const msg of allMessages) {
            const rawId = msg.chatId
            
            // Пропускаем status@broadcast
            if (!rawId || rawId.includes('status@broadcast')) {
                continue
            }

            chatMap.set(rawId, {
                chatId: rawId,
                lastMessage: msg.text,
                lastAt: msg.createdAt,
                lastSender: msg.sender,
                name: contactMap.get(rawId) || '',
                realJid: realJidMap.get(rawId) || null
            })
        }

        // Add contacts that don't have messages yet
        for (const contact of contacts) {
            // Игнорируем ЛЮБЫЕ пустые LID контакты, так как пустой LID чат не имеет смысла
            if (contact.chatId.includes('@lid')) continue;

            if (!chatMap.has(contact.chatId)) {
                chatMap.set(contact.chatId, {
                    chatId: contact.chatId,
                    lastMessage: '(Нет сообщений)',
                    lastAt: new Date(0),
                    lastSender: '',
                    name: contact.name || ''
                })
            }
        }
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
router.post('/bot/:id/send', async (req, res) => {
    try {
        const prisma = getPrisma()
        const botId = Number(req.params.id)
        const io = req.app.get('io')
        const { text, chatId: rawChatId } = req.body

        if (!text || !rawChatId) return res.status(400).json({ error: 'text and chatId are required' })

        const bot = await prisma.bot.findUnique({ where: { id: botId } })
        if (!bot) return res.status(404).json({ error: 'Bot not found' })

        let chatId = rawChatId;
        if (bot.platform === 'WHATSAPP') {
            chatId = rawChatId.includes('@') ? rawChatId : `${rawChatId}@s.whatsapp.net`;
            const { getWhatsAppSession } = await import('../services/whatsapp.js');
            const sock = getWhatsAppSession(botId);
            if (!sock) return res.status(503).json({ error: 'WhatsApp session not active. Start the bot first.' });
            await sock.sendMessage(chatId, { text });
        } else if (bot.platform === 'TELEGRAM') {
            if (!bot.apiToken) return res.status(503).json({ error: 'Telegram API token missing.' });
            await callTelegramAPI('sendMessage', bot.apiToken, {
                chat_id: chatId,
                text: text
            });
        }

        // Save sent message to DB
        const savedMsg = await prisma.message.create({
            data: { botId, sender: 'bot', text, chatId }
        })

        io.emit(`chat-${botId}`, savedMsg)
        res.json({ success: true, message: savedMsg })
    } catch (e) { res.status(500).json({ error: e.message }) }
})

// POST broadcast to multiple numbers
// Body: { text, chatIds: string[] }
router.post('/bot/:id/broadcast', async (req, res) => {
    try {
        const botId = Number(req.params.id)
        const prisma = getPrisma()
        const io = req.app.get('io')
        const { text, chatIds } = req.body

        if (!text || !chatIds?.length) return res.status(400).json({ error: 'text and chatIds are required' })

        const bot = await prisma.bot.findUnique({ where: { id: botId } })
        if (!bot) return res.status(404).json({ error: 'Bot not found' })

        const results = []

        if (bot.platform === 'WHATSAPP') {
            const { getWhatsAppSession } = await import('../services/whatsapp.js')
            const sock = getWhatsAppSession(botId)
            if (!sock) return res.status(503).json({ error: 'WhatsApp session not active' })

            for (const rawId of chatIds) {
                try {
                    const jid = rawId.includes('@') ? rawId : `${rawId}@s.whatsapp.net`
                    await sock.sendMessage(jid, { text })

                    const savedMsg = await prisma.message.create({
                        data: { botId, sender: 'bot', text, chatId: jid }
                    })
                    io.emit(`chat-${botId}`, savedMsg)
                    results.push({ chatId: jid, success: true })

                    await new Promise(r => setTimeout(r, 1000))
                } catch (err) {
                    results.push({ chatId: rawId, success: false, error: err.message })
                }
            }
        } else if (bot.platform === 'TELEGRAM') {
            if (!bot.apiToken) return res.status(503).json({ error: 'Telegram API token missing.' })
            
            for (const chatId of chatIds) {
                try {
                    await callTelegramAPI('sendMessage', bot.apiToken, {
                        chat_id: chatId,
                        text: text
                    })

                    const savedMsg = await prisma.message.create({
                        data: { botId, sender: 'bot', text, chatId: chatId }
                    })
                    io.emit(`chat-${botId}`, savedMsg)
                    results.push({ chatId, success: true })

                    await new Promise(r => setTimeout(r, 500)) // Rate limit for Telegram (approx 30 msgs/sec limit, but 0.5s is safe)
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
        const bot = await prisma.bot.findUnique({ where: { slug: req.params.slug } })
        
        if (!bot || !bot.isActive || bot.platform !== 'TELEGRAM') return

        const update = req.body
        if (!update.message) return

        let text = update.message.text || '';
        let telegramAudioBuffer = null;
        let mimeType = null;

        if (update.message.voice || update.message.audio) {
            const fileId = update.message.voice?.file_id || update.message.audio?.file_id;
            try {
                const fileData = await fetch(`https://api.telegram.org/bot${bot.apiToken}/getFile?file_id=${fileId}`).then(r=>r.json());
                if (fileData.ok) {
                    const filePath = fileData.result.file_path;
                    const audioRes = await fetch(`https://api.telegram.org/file/bot${bot.apiToken}/${filePath}`);
                    const arrayBuffer = await audioRes.arrayBuffer();
                    telegramAudioBuffer = Buffer.from(arrayBuffer);
                    mimeType = update.message.voice?.mime_type || update.message.audio?.mime_type || 'audio/ogg';
                    
                    const ext = filePath.split('.').pop() || 'ogg';
                    const filename = `tg_audio_${Date.now()}_${Math.floor(Math.random()*1000)}.${ext}`;
                    const localPath = path.join(__dirname, '../../uploads', filename);
                    fs.writeFileSync(localPath, telegramAudioBuffer);
                    
                    const audioTag = `[AUDIO]/uploads/${filename}`;
                    text = text ? `${text}\n${audioTag}` : audioTag;
                }
            } catch(e) { console.error('Telegram Audio error', e) }
        }

        if (!text && !telegramAudioBuffer) return

        const telegramChatId = update.message.chat.id.toString()
        let senderName = 'Telegram User'
        if (update.message.from) {
            const { first_name, last_name, username } = update.message.from
            if (username) {
                senderName = `@${username}`
            } else {
                senderName = [first_name, last_name].filter(Boolean).join(' ') || `User ${update.message.from.id}`
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

        // 2. Save user message
        const userMsg = await prisma.message.create({
            data: { botId: bot.id, sender: 'user', text, chatId: telegramChatId }
        })
        io.emit(`chat-${bot.id}`, userMsg)

        // If bot is paused for this chat, don't reply
        if ((bot.pausedChats || []).includes(telegramChatId)) return

        // 3. Check if user has messages remaining
        const canProceed = await hasEnoughMessages(bot.user_id)
        if (!canProceed) {
            await callTelegramAPI('sendMessage', bot.apiToken, {
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
        
        // GeminiService handles greeting logic automatically based on history presence
        const systemInstruction = `${bot.system_prompt || ''}\n\nCRITICAL: Follow the system instructions exactly. Pay extreme attention to any [Correction] or [IMPORTANT CORRECTION] tags at the end of the instructions.`;
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
            const geminiResult = await generateGeminiResponse(userMessage, history, systemInstruction, ragContext, telegramAudioBuffer, mimeType);
            aiResponseText = geminiResult.text;
            inputTokens = geminiResult.inputTokens;
            outputTokens = geminiResult.outputTokens;

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
        await callTelegramAPI('sendMessage', bot.apiToken, {
            chat_id: telegramChatId,
            text: aiResponseText
        })

        // 7. Save bot reply
        const botMsg = await prisma.message.create({
            data: { botId: bot.id, sender: 'bot', text: aiResponseText, chatId: telegramChatId }
        })
        io.emit(`chat-${bot.id}`, botMsg)

    } catch (e) {
        console.error('Telegram webhook processing error:', e)
    }
})

// ── INSTAGRAM WEBHOOK (GLOBAL) ──────────────────────────────

const igAccountToBotIdMap = new Map(); // instagram_business_account_id -> botId

async function getBotByInstagramAccountId(accountId) {
    const prisma = getPrisma();
    
    // 1. Check cache
    if (igAccountToBotIdMap.has(accountId)) {
        const botId = igAccountToBotIdMap.get(accountId);
        const bot = await prisma.bot.findUnique({ where: { id: botId } });
        if (bot && bot.isActive) return bot;
    }

    // 2. Fetch active Instagram bots and query Meta Graph API to resolve Instagram account IDs
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
                    igAccountToBotIdMap.set(igId, bot.id);
                    if (igId === accountId) {
                        return bot;
                    }
                }
            }
        } catch (e) {
            console.error(`[Instagram] Error fetching IG ID for bot ${bot.id}:`, e.message);
        }
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
        if (body.object !== 'instagram') return;

        const io = req.app.get('io');
        const prisma = getPrisma();

        for (const entry of (body.entry || [])) {
            const recipientId = entry.id; // Instagram Account ID receiving the message
            if (!recipientId) continue;

            const bot = await getBotByInstagramAccountId(recipientId);
            if (!bot || !bot.isActive) {
                console.log(`[Instagram] Active bot not found for Instagram Business Account: ${recipientId}`);
                continue;
            }

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
                    contact = await prisma.contact.create({ data: { botId: bot.id, chatId: senderId, name: `Instagram User ${senderId}` } });
                    io.emit(`contact-update-${bot.id}`, contact);
                }

                // 2. Save user message
                const userMsg = await prisma.message.create({
                    data: { botId: bot.id, sender: 'user', text: messageText, chatId: senderId }
                });
                io.emit(`chat-${bot.id}`, userMsg);

                // Skip if chat is paused
                if ((bot.pausedChats || []).includes(senderId)) continue;

                // 3. Check balance
                const canProceed = await hasEnoughMessages(bot.user_id);
                if (!canProceed) {
                    await sendInstagramMessage(bot.apiToken, senderId, 'Баланс сообщений исчерпан. Пополните баланс в панели управления.');
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
                    const sysInstruction = `${bot.system_prompt || ''}\n\nCRITICAL: Follow the system instructions exactly.`;
                    const geminiResult = await generateGeminiResponse(userMessage, history, sysInstruction, bot.data_prompt || '');
                    aiResponseText = geminiResult.text;
                    inputTokens = geminiResult.inputTokens;
                    outputTokens = geminiResult.outputTokens;

                    await trackUsage({
                        userId: bot.user_id, botId: bot.id,
                        provider: 'vertex-ai', inputTokens, outputTokens, model: geminiResult.model
                    });
                    console.log(`[Instagram Bot ${bot.id}] Gemini usage: in=${inputTokens} out=${outputTokens}`);
                } catch (err) {
                    console.error(`[Instagram Bot ${bot.id}] Gemini Error:`, err.message);
                }

                // 6. Send reply via Instagram Graph API
                await sendInstagramMessage(bot.apiToken, senderId, aiResponseText);

                // 7. Save bot reply
                const botMsg = await prisma.message.create({
                    data: { botId: bot.id, sender: 'bot', text: aiResponseText, chatId: senderId }
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

CRITICAL RULES FOR new_data_prompt:
You MUST format new_data_prompt EXACTLY like this with these specific headers, otherwise the system will break:
Компания:
[Name]

Описание:
[Description]

Преимущества:
[Benefits]

Цены и условия:
[Pricing]

FAQ:
В: [Question]
О: [Answer]

Полезные ссылки:
[Title]: [URL]

Контакт менеджера:
[Contact]

Do not change or omit the headers!
Ensure the output is strictly valid JSON. Do not add markdown blocks around JSON.`;

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
