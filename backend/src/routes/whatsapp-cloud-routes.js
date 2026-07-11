import express from 'express';

import { prisma } from './bot-routes.js';
import { generateGeminiResponse } from '../services/GeminiService.js';

const router = express.Router();

// Meta verification handshake
router.get('/', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    } else {
        res.sendStatus(400);
    }
});

// Incoming messages webhook
router.post('/', async (req, res) => {
    // 1. Immediately return 200 OK to prevent Meta from retrying
    res.sendStatus(200);

    const body = req.body;

    // 2. Validate payload structure
    if (body.object === 'whatsapp_business_account') {
        try {
            for (const entry of body.entry) {
                for (const change of entry.changes) {
                    const value = change.value;
                    
                    // Only process new messages, not statuses
                    if (value.messages && value.messages.length > 0) {
                        const message = value.messages[0];
                        const contactInfo = value.contacts && value.contacts.length > 0 ? value.contacts[0] : null;
                        
                        // Extract required fields
                        const senderNumber = message.from; // Phone number without '+'
                        const messageText = message.text ? message.text.body : '';
                        const phoneNumberId = value.metadata.phone_number_id; // e.g. 1166856433186146
                        const senderName = contactInfo && contactInfo.profile ? contactInfo.profile.name : 'Contact';
                        
                        if (!messageText) {
                            console.log('[WA Cloud] Received non-text message, skipping.');
                            continue;
                        }

                        console.log(`[WA Cloud] Message from ${senderNumber}: ${messageText}`);

                        // 3. Find the active WhatsApp bot
                        const bot = await prisma.bot.findFirst({
                            where: { platform: 'WHATSAPP', isActive: true },
                            orderBy: { createdAt: 'desc' }
                        });

                        if (!bot) {
                            console.log('[WA Cloud] No active WhatsApp bot found in database. Ignoring message.');
                            continue;
                        }

                        // 4. Update or create Contact
                        const chatIdStr = `${senderNumber}@s.whatsapp.net`;
                        await prisma.contact.upsert({
                            where: { botId_chatId: { botId: bot.id, chatId: chatIdStr } },
                            update: { name: senderName, realJid: chatIdStr },
                            create: { botId: bot.id, chatId: chatIdStr, name: senderName, realJid: chatIdStr }
                        });

                        // 5. Save incoming message to DB
                        await prisma.message.create({
                            data: {
                                botId: bot.id,
                                platform: 'WHATSAPP',
                                sender: 'user',
                                text: messageText,
                                chatId: chatIdStr
                            }
                        });

                        // 6. Fetch conversation history
                        const rawHistory = await prisma.message.findMany({
                            where: { botId: bot.id, chatId: chatIdStr },
                            orderBy: { createdAt: 'asc' },
                            take: 15
                        });

                        const history = rawHistory.map(m => ({
                            role: m.sender === 'bot' ? 'model' : 'user',
                            parts: [{ text: m.text }]
                        }));

                        // 7. Call existing AI logic
                        console.log('[WA Cloud] Calling Gemini...');
                        const aiResponse = await generateGeminiResponse(
                            messageText,
                            history,
                            bot.system_prompt,
                            bot.data_prompt
                        );

                        const replyText = aiResponse.text;
                        console.log(`[WA Cloud] Gemini Response: ${replyText}`);

                        // 8. Send reply via WhatsApp Cloud API
                        const accessToken = process.env.WHATSAPP_CLOUD_ACCESS_TOKEN;
                        const apiUrl = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
                        
                        const payload = {
                            messaging_product: 'whatsapp',
                            to: senderNumber,
                            type: 'text',
                            text: { body: replyText }
                        };

                        const response = await fetch(apiUrl, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${accessToken}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(payload)
                        });

                        const responseData = await response.json();
                        
                        if (response.ok) {
                            console.log(`[WA Cloud] Message sent successfully to ${senderNumber}`);
                        } else {
                            console.error(`[WA Cloud] Failed to send message:`, responseData);
                        }

                        // 9. Save bot's reply to DB
                        await prisma.message.create({
                            data: {
                                botId: bot.id,
                                platform: 'WHATSAPP',
                                sender: 'bot',
                                text: replyText,
                                chatId: chatIdStr
                            }
                        });
                    }
                }
            }
        } catch (error) {
            console.error('[WA Cloud] Error processing webhook:', error);
        }
    }
});

export default router;
