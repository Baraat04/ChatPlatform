import express from "express"

import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';
import { PrismaPg } from '@prisma/adapter-pg'
import dotenv from 'dotenv'

dotenv.config()

const router = express.Router()

const adapter = new PrismaPg({
   connectionString: process.env.DATABASE_URL
})

const prisma = new PrismaClient({adapter});

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
     const { system_prompt, data_prompt, botToken, user_id } = req.body;

        // 1. Basic Validation
        if (!botToken || !user_id) {
            return res.status(400).json({ error: 'botToken and user_id are required.' });
        }

        // 2. Generate unique slug
        const slug = nanoid(10); // Generates a URL-safe 10-character string

        // 3. Save to Database
        const newBot = await prisma.bot.create({
            data: {
                slug,
                system_prompt,
                data_prompt,
                apiToken: botToken,
                platform: 'TELEGRAM',
                user_id: Number(user_id) 
            }
        });

        // 4. Configure Webhook with Telegram
        const baseUrl = process.env.BASE_URL || 'https://your-domain.com';
        const webhookUrl = `${baseUrl}/api/webhook/${slug}`;

    try {
        await callTelegramAPI('setWebhook', botToken, {
            url: webhookUrl,
            drop_pending_updates: true // Optional: ignores messages sent while bot was offline
        });

        return res.status(201).json({
            message: 'Bot created and webhook configured successfully.',
            bot: {
                id: newBot.id,
                slug: newBot.slug,
                platform: newBot.platform
            },
            webhookUrl
        });
    } catch (error) {
        await prisma.bot.delete({ where: { id: newBot.id } })
        console.error('Error creating bot:', error);
        return res.status(500).json({ error: 'Failed to create bot or set webhook.', details: error.message });
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

        // 3. Build final system context
        let systemInstructionText = "";

        if (bot.system_prompt) {
            systemInstructionText += bot.system_prompt + "\n\n";
        }

        if (bot.data_prompt) {
            systemInstructionText += "Knowledge Base:\n" + bot.data_prompt;
        }

        // 4. Call OpenRouter AI
        const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: process.env.OPENROUTER_MODEL || "openrouter/owl-alpha",
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

        console.log("OPENROUTER RAW:", JSON.stringify(aiData, null, 2));

        const aiResponseText =
            aiData.choices?.[0]?.message?.content ||
            "Sorry, AI service is temporarily unavailable.";

        console.log("🤖 AI:", aiResponseText);

        // 5. Send response back to Telegram
        await callTelegramAPI("sendMessage", bot.apiToken, {
            chat_id: chatId,
            text: aiResponseText
        });

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

export default router;