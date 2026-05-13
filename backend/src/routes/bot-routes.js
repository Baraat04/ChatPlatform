import express from 'express'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pkgPg from 'pg'
const { Pool } = pkgPg

const router = express.Router()

// Lazy Prisma init so DATABASE_URL is already loaded from .env
let _prisma = null
function getPrisma() {
    if (_prisma) return _prisma
    const url = process.env.DATABASE_URL
    if (!url) throw new Error('DATABASE_URL environment variable is not set')
    const pool = new Pool({ connectionString: url })
    const adapter = new PrismaPg(pool)
    _prisma = new PrismaClient({ adapter })
    return _prisma
}
export { getPrisma as prisma }

// ── BOTS ────────────────────────────────────────────────

// GET all bots
router.get('/bot', async (req, res) => {
    try {
        const prisma = getPrisma()
        const bots = await prisma.bot.findMany({ orderBy: { createdAt: 'desc' } })
        res.json(bots)
    } catch (e) { res.status(500).json({ error: e.message }) }
})

// GET single bot
router.get('/bot/:id', async (req, res) => {
    try {
        const prisma = getPrisma()
        const bot = await prisma.bot.findUnique({ where: { id: Number(req.params.id) } })
        if (!bot) return res.status(404).json({ error: 'Bot not found' })
        res.json(bot)
    } catch (e) { res.status(500).json({ error: e.message }) }
})

// POST create bot
router.post('/bot', async (req, res) => {
    try {
        const prisma = getPrisma()
        const io = req.app.get('io')
        const { platform, system_prompt, data_prompt, apiToken } = req.body

        const bot = await prisma.bot.create({
            data: {
                slug: `bot-${Date.now()}`,
                platform,
                system_prompt: system_prompt || '',
                data_prompt: data_prompt || '',
                apiToken: apiToken || null,
                isActive: false,
                user_id: 1,
            }
        })

        res.json(bot)

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
router.put('/bot/:id', async (req, res) => {
    try {
        const prisma = getPrisma()
        const { system_prompt, data_prompt, apiToken } = req.body
        const bot = await prisma.bot.update({
            where: { id: Number(req.params.id) },
            data: { system_prompt, data_prompt, apiToken }
        })
        res.json(bot)
    } catch (e) { res.status(500).json({ error: e.message }) }
})

// DELETE bot
router.delete('/bot/:id', async (req, res) => {
    try {
        const prisma = getPrisma()
        const botId = Number(req.params.id)
        const bot = await prisma.bot.findUnique({ where: { id: botId } })

        // Stop WhatsApp session if running
        if (bot?.platform === 'WHATSAPP') {
            try {
                const { stopWhatsAppBot } = await import('../services/whatsapp.js')
                stopWhatsAppBot(botId)
            } catch (e) {}

            // Remove session files
            const { default: fs } = await import('fs')
            const { default: path } = await import('path')
            const { fileURLToPath } = await import('url')
            const __dirname = path.dirname(fileURLToPath(import.meta.url))
            const sessionDir = path.join(__dirname, `../../sessions/bot_${botId}`)
            try { fs.rmSync(sessionDir, { recursive: true, force: true }) } catch (e) {}
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
                stopWhatsAppBot(botId)
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
            contactMap.set(c.chatId, c.name)
            if (c.realJid) realJidMap.set(c.chatId, c.realJid)
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

        const chatId = rawChatId.includes('@') ? rawChatId : `${rawChatId}@s.whatsapp.net`

        const bot = await prisma.bot.findUnique({ where: { id: botId } })
        if (!bot) return res.status(404).json({ error: 'Bot not found' })

        if (bot.platform === 'WHATSAPP') {
            const { getWhatsAppSession } = await import('../services/whatsapp.js')
            const sock = getWhatsAppSession(botId)
            if (!sock) return res.status(503).json({ error: 'WhatsApp session not active. Start the bot first.' })

            await sock.sendMessage(chatId, { text })
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
                    // Рассылка по номерам - тут дописываем @s.whatsapp.net если это просто цифры
                    const jid = rawId.includes('@') ? rawId : `${rawId}@s.whatsapp.net`
                    await sock.sendMessage(jid, { text })

                    const savedMsg = await prisma.message.create({
                        data: { botId, sender: 'bot', text, chatId: jid }
                    })
                    io.emit(`chat-${botId}`, savedMsg)
                    results.push({ chatId: jid, success: true })

                    // Rate limit: 1 message per second
                    await new Promise(r => setTimeout(r, 1000))
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

export default router
