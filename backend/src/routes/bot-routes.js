import express from "express"

import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { nanoid } from 'nanoid';
import { PrismaPg } from '@prisma/adapter-pg'

const router = express.Router()

function getPrisma() {
    const url = process.env.DATABASE_URL
    if (!url) throw new Error('DATABASE_URL environment variable is not set')
    const adapter = new PrismaPg(url)
    return new PrismaClient({ adapter })
}

export const prisma = getPrisma();

async function callTelegramAPI(method, botToken, payload) {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Telegram API Error (${method}): ${errorData}`);
    }
    return response.json();
}

router.post('/bot', async (req, res, next) => {
     const { system_prompt, data_prompt, botToken, user_id, platform = 'TELEGRAM' } = req.body;

        // 1. Basic Validation
        if (!user_id) {
            return res.status(400).json({ error: 'user_id is required.' });
        }
        if (platform === 'TELEGRAM' && !botToken) {
            return res.status(400).json({ error: 'botToken is required for Telegram.' });
        }

        if (botToken) {
            const data = await prisma.bot.findFirst({
                where:{
                    apiToken: botToken
                }
            })
            if(data){
                return res.status(400).json({ error: 'Bot with this token already exists.' });
            }
        }

        // 2. Generate unique slug
        const slug = nanoid(10); // Generates a URL-safe 10-character string

        // 3. Save to Database
        const newBot = await prisma.bot.create({
            data: {
                slug,
                system_prompt,
                data_prompt,
                apiToken: botToken || null,
                platform: platform,
                user_id: Number(user_id) 
            }
        });


        if (platform === 'WHATSAPP') {
            const io = req.app.get('io')
            import('../services/whatsapp.js').then(({ startWhatsAppBot }) => {
                startWhatsAppBot(newBot, prisma, io)
            })

            return res.status(201).json({
                message: 'WhatsApp Bot created. Check the dashboard for QR code.',
                bot: { id: newBot.id, slug: newBot.slug, platform: newBot.platform }
            })
        }

        // 4. Configure Webhook with Telegram
        const baseUrl = process.env.BASE_URL || 'https://your-domain.com';
        const webhookUrl = `${baseUrl}/api/webhook/${slug}`;

        try {
            await callTelegramAPI('setWebhook', botToken, {
                url: webhookUrl,
                drop_pending_updates: true
            });

            return res.status(201).json({
                message: 'Telegram Bot created and webhook configured successfully.',
                bot: { id: newBot.id, slug: newBot.slug, platform: newBot.platform },
                webhookUrl
            });
        } catch (error) {
            await prisma.bot.delete({ where: { id: newBot.id } })
            console.error('Error creating Telegram bot:', error);
            return res.status(500).json({ error: 'Failed to create Telegram bot or set webhook.', details: error.message });
        }
});


router.post('/webhook/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const update = req.body;

        console.log("🔥 WEBHOOK HIT:", slug);

        // 1. Find bot in DB
        const bot = await prisma.bot.findUnique({
            where: { slug:slug }
        });

        if (!bot || !bot.isActive) {
            console.warn(`Webhook for unknown/inactive bot: ${slug}`);
            return res.status(404).send("Bot not found");
        }

        const message =
            update.message ||
            update.edited_message ||
            update.channel_post;

        if (!message || !message.text) {
            return res.status(200).send("OK");
        }

        const chatId = message.chat.id;
        const userText = message.text;

        console.log("👤 USER:", userText);
        
        // Save incoming Telegram message
        try {
            const incomingMsg = await prisma.message.create({
                data: { botId: bot.id, sender: 'user', text: userText, chatId: String(chatId) }
            })
            req.app.get('io')?.emit(`chat-${bot.id}`, incomingMsg)
        } catch (dbErr) { console.error('DB Error saving user msg:', dbErr) }

        // 3. Build final system context
        let systemInstructionText = "";

        if (bot.system_prompt) {
            systemInstructionText += bot.system_prompt + "\n\n";
        }

        if (bot.data_prompt) {
            systemInstructionText += "Knowledge Base:\n" + bot.data_prompt;
        }

        // 4. Call Local LM Studio AI
        const aiResponse = await fetch("http://127.0.0.1:1234/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "liquid/lfm2.5-1.2b",
                messages: [
                    {
                        role: "system",
                        content: systemInstructionText
                    },
                    {
                        role: "user",
                        content: userText
                    }
                ]
            })
        });

        const aiData = await aiResponse.json();

        console.log("LM STUDIO RAW:", JSON.stringify(aiData, null, 2));

        const aiResponseText =
            aiData.choices?.[0]?.message?.content ||
            "Sorry, AI service is temporarily unavailable.";

        console.log("🤖 AI:", aiResponseText);

        // 5. Send response back to Telegram
        await callTelegramAPI("sendMessage", bot.apiToken, {
            chat_id: chatId,
            text: aiResponseText
        });
        
        // Save outgoing Telegram message
        try {
            const outgoingMsg = await prisma.message.create({
                data: { botId: bot.id, sender: 'bot', text: aiResponseText, chatId: String(chatId) }
            })
            req.app.get('io')?.emit(`chat-${bot.id}`, outgoingMsg)
        } catch (dbErr) { console.error('DB Error saving bot msg:', dbErr) }

        return res.status(200).send("OK");

    } catch (error) {
        console.error("Webhook processing error:", error);
        return res.status(200).send("OK");
    }
});

router.get('/bot', async (req,res) => {
    const data = await prisma.bot.findMany({
        omit: {
            apiToken:true
        }
    })
    res.json(data)
})

router.get('/bot/:id/messages', async (req, res) => {
    try {
        const messages = await prisma.message.findMany({
            where: { botId: Number(req.params.id) },
            orderBy: { createdAt: 'asc' }
        })
        res.json(messages)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

router.put('/bot/:id', async (req, res) => {
    try {
        const { system_prompt, data_prompt } = req.body
        const updatedBot = await prisma.bot.update({
            where: { id: Number(req.params.id) },
            data: { system_prompt, data_prompt }
        })
        res.json(updatedBot)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

router.post('/bot/:id/send', async (req, res) => {
    try {
        const botId = Number(req.params.id)
        const { text, chatId } = req.body
        
        if (!text || !chatId) return res.status(400).json({ error: "text and chatId are required" })

        const bot = await prisma.bot.findUnique({ where: { id: botId } })
        if (!bot) return res.status(404).send("Bot not found")

        if (bot.platform === 'WHATSAPP') {
            const { getWhatsAppSession } = await import('../services/whatsapp.js')
            const sock = getWhatsAppSession(botId)
            if (!sock) return res.status(400).json({ error: "WhatsApp session not active. Make sure the bot is connected." })
            
            // Use chatId as-is from DB. It should already be a proper JID (@s.whatsapp.net or @lid)
            const finalChatId = chatId.includes('@') ? chatId : `${chatId}@s.whatsapp.net`
            
            console.log(`[Bot ${botId}] Sending manual message to: ${finalChatId}`)
            try {
                await sock.sendMessage(finalChatId, { text })
                console.log(`[Bot ${botId}] Message sent successfully to ${finalChatId}`)
            } catch (sendErr) {
                console.error(`[Bot ${botId}] sock.sendMessage failed:`, sendErr)
                return res.status(500).json({ error: `WhatsApp delivery failed: ${sendErr.message}` })
            }
            
            const outgoingMsg = await prisma.message.create({
                data: { botId, sender: 'bot', text, chatId: finalChatId }
            })
            req.app.get('io')?.emit(`chat-${botId}`, outgoingMsg)
            return res.json({ success: true, message: outgoingMsg })

        } else if (bot.platform === 'TELEGRAM') {
            await callTelegramAPI("sendMessage", bot.apiToken, { chat_id: chatId, text })
            const outgoingMsg = await prisma.message.create({
                data: { botId, sender: 'bot', text, chatId: String(chatId) }
            })
            req.app.get('io')?.emit(`chat-${botId}`, outgoingMsg)
            return res.json({ success: true, message: outgoingMsg })
        }

        res.status(400).json({ error: "Unknown platform" })
    } catch (error) {
        console.error('Send error:', error)
        res.status(500).json({ error: error.message })
    }
})

router.post('/bot/:id/resume', async (req, res) => {
    try {
        const botId = Number(req.params.id)
        const { chatId } = req.body
        const bot = await prisma.bot.findUnique({ where: { id: botId } })
        if (!bot) return res.status(404).send("Bot not found")
        
        await prisma.bot.update({
            where: { id: bot.id },
            data: { pausedChats: bot.pausedChats.filter(id => id !== chatId) }
        })
        res.json({ success: true })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

router.post('/bot/:id/broadcast', async (req, res) => {
    try {
        const botId = Number(req.params.id)
        const { text, chatIds } = req.body
        
        const bot = await prisma.bot.findUnique({ where: { id: botId } })
        if (!bot) return res.status(404).send("Bot not found")

        let sock;
        if (bot.platform === 'WHATSAPP') {
            const { getWhatsAppSession } = await import('../services/whatsapp.js')
            sock = getWhatsAppSession(botId)
            if (!sock) return res.status(400).send("WhatsApp session not active")
        }

        let successCount = 0;
        for (const chatId of chatIds) {
            try {
                if (bot.platform === 'WHATSAPP') {
                    const finalChatId = chatId.includes('@') ? chatId : `${chatId}@s.whatsapp.net`
                    await sock.sendMessage(finalChatId, { text })
                    
                    const outgoingMsg = await prisma.message.create({
                        data: { botId, sender: 'bot', text, chatId: finalChatId }
                    })
                    req.app.get('io')?.emit(`chat-${botId}`, outgoingMsg)
                } else if (bot.platform === 'TELEGRAM') {
                    await callTelegramAPI("sendMessage", bot.apiToken, {
                        chat_id: chatId,
                        text: text
                    });
                    const outgoingMsg = await prisma.message.create({
                        data: { botId, sender: 'bot', text, chatId: String(chatId) }
                    })
                    req.app.get('io')?.emit(`chat-${botId}`, outgoingMsg)
                }
                successCount++;
                await new Promise(r => setTimeout(r, 500)); // anti-spam delay
            } catch(e) {
                console.error(`Broadcast failed for ${chatId}:`, e);
            }
        }

        res.json({ success: true, sent: successCount, total: chatIds.length })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

router.delete('/bot/:id', async (req, res) => {
    try {
        const botId = Number(req.params.id)
        const bot = await prisma.bot.findUnique({ where: { id: botId } })
        
        if (bot?.platform === 'WHATSAPP') {
            import('fs').then(fs => {
                const sessionDir = import('path').then(path => {
                    const dir = path.join(process.cwd(), `../sessions/bot_${botId}`)
                    try { fs.rmSync(dir, { recursive: true, force: true }) } catch (e) {}
                })
            })
        }
        
        await prisma.bot.delete({ where: { id: botId } })
        res.json({ success: true })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

export default router;