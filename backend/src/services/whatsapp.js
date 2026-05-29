import { makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers } from '@whiskeysockets/baileys'
import pino from 'pino'
import { Boom } from '@hapi/boom'
import { trackUsage, hasEnoughMessages } from './usage-tracker.js'
import { generateGeminiResponse } from './GeminiService.js';
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import qrcode from 'qrcode'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const sessions = new Map() // botId -> socket

export const startWhatsAppBot = async (bot, prisma, io) => {
    const { id: botId, system_prompt, data_prompt } = bot

    if (sessions.has(botId)) {
        console.log(`WhatsApp bot ${botId} is already running.`)
        return sessions.get(botId)
    }

    const sessionDir = path.join(__dirname, `../../sessions/bot_${botId}`)
    if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir, { recursive: true })
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir)

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }), // change to 'debug' for detailed logs
        version: [2, 3000, 1033893291],
        browser: ["Chrome", "Windows", "10"],
        markOnlineOnConnect: false,
        syncFullHistory: false,
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 60000
    })

    sessions.set(botId, sock)
    
    // Persistent LID to JID mapping from DB
    let lidToJid = new Map()
    try {
        const contactsWithLid = await prisma.contact.findMany({
            where: { botId, chatId: { contains: '@lid' }, realJid: { not: null } }
        })
        contactsWithLid.forEach(c => lidToJid.set(c.chatId, c.realJid))
        console.log(`[WhatsApp Bot ${botId}] Loaded ${lidToJid.size} LID mappings from DB`)
    } catch (e) {}

    sock.ev.on('creds.update', saveCreds)

    // Keep track of contact names
    const contactNames = new Map()

    // Rate limiting and cache for LID resolution
    const resolveCache = new Map(); // lid -> { jid, timestamp }
    const resolveLocks = new Set();

    const extractJidFromVcard = (vcard) => {
        if (!vcard) return null;
        const match = vcard.match(/waid=(\d+)/);
        if (match) return `${match[1]}@s.whatsapp.net`;
        const telMatch = vcard.match(/TEL;.*:(\+?\d+)/);
        if (telMatch) {
            const num = telMatch[1].replace(/\D/g, '');
            if (num) return `${num}@s.whatsapp.net`;
        }
        return null;
    };

    /**
     * Resolves a real phone number (JID) from a given LID.
     * Tries multiple strategies sequentially with rate limiting and caching.
     * @param {Object} sock WhatsApp socket/client
     * @param {string} lid Linked Device ID
     * @param {Object} msgContext Optional context from incoming message
     * @returns {Promise<string|null>} Real JID or null
     */
    const resolvePhoneFromLid = async (sock, lid, msgContext = null) => {
        if (!lid || !lid.includes('@lid')) return lid;

        if (resolveCache.has(lid)) {
            const cached = resolveCache.get(lid);
            // 7 days TTL cache
            if (Date.now() - cached.timestamp < 7 * 24 * 60 * 60 * 1000) {
                return cached.jid;
            }
        }

        if (resolveLocks.has(lid)) {
            // Wait up to 2.5s for the lock to clear
            for (let i = 0; i < 5; i++) {
                await new Promise(r => setTimeout(r, 500));
                if (resolveCache.has(lid)) return resolveCache.get(lid).jid;
            }
            return null;
        }
        resolveLocks.add(lid);

        let jid = null;
        let strategy = '';

        try {
            console.log(`[WhatsApp Bot ${botId}] Resolving LID: ${lid}...`);

            // 0. The Ultimate Baileys Session Hack
            if (!jid) {
                const cleanLid = lid.split('@')[0];
                const reversePath = path.join(sessionDir, `lid-mapping-${cleanLid}_reverse.json`);
                try {
                    if (fs.existsSync(reversePath)) {
                        const fileContent = fs.readFileSync(reversePath, 'utf8');
                        const parsedJid = JSON.parse(fileContent);
                        if (parsedJid) {
                            jid = `${parsedJid}@s.whatsapp.net`;
                            strategy = 'Session File (100% Reliable)';
                        }
                    }
                } catch(e) {}
            }

            // 1. VCard Check
            if (!jid && msgContext?.message?.contactMessage?.vcard) {
                const vcardJid = extractJidFromVcard(msgContext.message.contactMessage.vcard);
                if (vcardJid) { jid = vcardJid; strategy = 'VCard'; }
            }

            // 2. Baileys onWhatsApp
            if (!jid && typeof sock.onWhatsApp === 'function') {
                try {
                    const res = await sock.onWhatsApp(lid);
                    if (res && res[0] && res[0].jid && res[0].jid.includes('@s.whatsapp.net')) {
                        jid = res[0].jid; strategy = 'onWhatsApp';
                    }
                } catch (e) {}
            }

            // 3. Hack with pushName (chat.name equivalent)
            if (!jid && msgContext?.pushName) {
                const possiblePhone = msgContext.pushName.replace(/\D/g, '');
                if (possiblePhone && possiblePhone.length >= 10 && possiblePhone.length <= 15) {
                     try {
                         const verify = await sock.onWhatsApp(possiblePhone);
                         if (verify && verify[0] && verify[0].exists) {
                             jid = `${possiblePhone}@s.whatsapp.net`;
                             strategy = 'pushName Hack';
                         }
                     } catch(e) {}
                }
            }

            // 4. whatsapp-web.js specific methods (Fallback if client supports)
            if (!jid && typeof sock.getContactLidAndPhone === 'function') {
                try {
                    const res = await sock.getContactLidAndPhone([lid]);
                    if (res && res[lid]) { jid = res[lid]; strategy = 'getContactLidAndPhone'; }
                } catch(e) {}
            }
            if (!jid && typeof sock.getContactById === 'function') {
                try {
                    const contact = await sock.getContactById(lid);
                    if (contact && contact.number) { jid = `${contact.number}@s.whatsapp.net`; strategy = 'getContactById'; }
                } catch(e) {}
            }

            // 5. Triggers to force server update
            if (!jid) {
                try { await sock.profilePictureUrl(lid); } catch(e) {}
                await new Promise(r => setTimeout(r, 500));
                try { await sock.fetchStatus(lid); } catch(e) {}
                
                // Re-check cache in case a background event resolved it
                if (resolveCache.has(lid)) {
                    jid = resolveCache.get(lid).jid;
                    strategy = 'Triggers + Event';
                }
            }

            if (jid) {
                console.log(`[WhatsApp] Successfully resolved ${lid} -> ${jid} via [${strategy}]`);
                resolveCache.set(lid, { jid, timestamp: Date.now() });
            } else {
                console.log(`[WhatsApp] Could not resolve ${lid}. Preserving as LID due to privacy restrictions.`);
            }
        } catch (err) {
            console.error(`[WhatsApp] Error resolving LID:`, err.message);
        } finally {
            resolveLocks.delete(lid);
        }
        return jid;
    };

    const handleContactUpdate = async (contact) => {
        const name = contact.name || contact.notify || contact.verifiedName;
        let jid = contact.id;
        const lid = contact.lid;

        // Attempt to extract JID from vcard if JID is not a real number
        if (!jid || jid.includes('@lid')) {
            const vcardJid = extractJidFromVcard(contact.vcard);
            if (vcardJid) jid = vcardJid;
        }

        if (lid && jid && jid.includes('@s.whatsapp.net')) {
            lidToJid.set(lid, jid);
            resolveCache.set(lid, { jid, timestamp: Date.now() });
            try {
                await prisma.message.updateMany({
                    where: { botId, chatId: lid },
                    data: { chatId: jid }
                });
                
                // Fetch to prevent duplicate error
                const existing = await prisma.contact.findUnique({ where: { botId_chatId: { botId, chatId: lid } } });
                let updatedContact = null;
                if (existing) {
                    updatedContact = await prisma.contact.update({
                        where: { botId_chatId: { botId, chatId: lid } },
                        data: { realJid: jid, name: name || existing.name }
                    });
                } else {
                    updatedContact = await prisma.contact.create({
                        data: { botId, chatId: lid, realJid: jid, name: name || 'Contact' }
                    });
                }
                if (updatedContact) io.emit(`contact-update-${botId}`, updatedContact);
            } catch (e) {
                console.error('[handleContactUpdate] Error updating lid->jid:', e);
            }
        }

        if (name && jid) {
            contactNames.set(jid, name);
            try {
                const existing = await prisma.contact.findUnique({ where: { botId_chatId: { botId, chatId: jid } } });
                let updatedContact = null;
                if (existing) {
                    updatedContact = await prisma.contact.update({
                        where: { botId_chatId: { botId, chatId: jid } },
                        data: { name }
                    });
                } else {
                    updatedContact = await prisma.contact.create({
                        data: { botId, chatId: jid, name }
                    });
                }
                if (updatedContact) io.emit(`contact-update-${botId}`, updatedContact);
            } catch (e) {
                console.error('[handleContactUpdate] Error updating contact name:', e);
            }
        }
    };

    sock.ev.on('contacts.upsert', async (contacts) => {
        console.log(`[WhatsApp Bot ${botId}] Received ${contacts.length} contacts via upsert`);
        for (const contact of contacts) {
            await handleContactUpdate(contact);
        }
    })

    // Добавляем обработку начальной истории
    sock.ev.on('messaging-history.set', async ({ chats, contacts }) => {
        console.log(`[WhatsApp Bot ${botId}] Initial history: ${chats?.length || 0} chats, ${contacts?.length || 0} contacts`)
        if (contacts) {
            for (const contact of contacts) {
                await handleContactUpdate(contact);
            }
        }
    })

    sock.ev.on('contacts.update', async (updates) => {
        console.log(`[WhatsApp Bot ${botId}] Received ${updates.length} contact updates`)
        for (const update of updates) {
            await handleContactUpdate(update);
        }
    })

    sock.ev.on('connection.update', async (update) => {
        try {
            const { connection, lastDisconnect, qr } = update

            if (qr) {
                console.log(`[WhatsApp Bot ${botId}] QR code generated`)
                // Convert to data URL to send to frontend
                const qrDataUrl = await qrcode.toDataURL(qr)
                io.emit(`qr-${botId}`, qrDataUrl)
            }

            if (connection === 'close') {
                const statusCode = (lastDisconnect?.error instanceof Boom) ? lastDisconnect.error.output?.statusCode : undefined;
                const shouldReconnect = statusCode !== DisconnectReason.loggedOut && statusCode !== 405;
                
                console.log(`[WhatsApp Bot ${botId}] connection closed due to`, lastDisconnect?.error, ', reconnecting:', shouldReconnect)
                
                sessions.delete(botId)
                
                if (shouldReconnect) {
                    setTimeout(() => startWhatsAppBot(bot, prisma, io).catch(console.error), 2000)
                } else {
                    console.log(`[WhatsApp Bot ${botId}] Session invalid/logged out (Code ${statusCode}). Deleting session data.`)
                    try { fs.rmSync(sessionDir, { recursive: true, force: true }) } catch (e) {}
                    io.emit(`status-${botId}`, 'logged_out')
                }
            } else if (connection === 'open') {
                console.log(`[WhatsApp Bot ${botId}] Connected!`)
                io.emit(`status-${botId}`, 'connected')
            }
        } catch (err) {
            console.error(`[WhatsApp Bot ${botId}] connection.update error:`, err)
        }
    })

    sock.ev.on('messages.upsert', async (m) => {
        try {
            const msg = m.messages[0]
            if (!msg.message) return // Ignore empty

            let senderNumber = msg.key.remoteJid
            // Игнорируем технические рассылки статусов
            if (senderNumber === 'status@broadcast') return

            // Resolve LID to real phone number if possible
            if (senderNumber.includes('@lid')) {
                const possibleJid = msg.participant || msg.key?.participant
                if (possibleJid && possibleJid.includes('@s.whatsapp.net')) {
                    const oldLid = senderNumber
                    lidToJid.set(oldLid, possibleJid)
                    senderNumber = possibleJid
                    
                    try {
                        await prisma.message.updateMany({
                            where: { botId, chatId: oldLid },
                            data: { chatId: possibleJid }
                        })
                        await prisma.contact.upsert({
                            where: { botId_chatId: { botId, chatId: oldLid } },
                            update: { realJid: possibleJid },
                            create: { botId, chatId: oldLid, realJid: possibleJid, name: msg.pushName || 'Contact' }
                        })
                    } catch (e) {}
                } else if (lidToJid.has(senderNumber)) {
                    const mappedJid = lidToJid.get(senderNumber)
                    console.log(`[LID MATCH] Mapping LID ${senderNumber} to JID ${mappedJid}`)
                    senderNumber = mappedJid
                } else {
                    // Fallback to DB lookup if map is missing it (e.g., manual link)
                    try {
                        const dbContact = await prisma.contact.findFirst({ where: { botId, chatId: senderNumber, realJid: { not: null } } });
                        if (dbContact) {
                            lidToJid.set(senderNumber, dbContact.realJid);
                            senderNumber = dbContact.realJid;
                        } else {
                            console.log(`[LID MISS] No mapping found for LID ${senderNumber}. Running resolution hook...`);
                            
                            // AUTO RESOLVE USING THE NEW HOOK
                            const oldLid = senderNumber;
                            const newJid = await resolvePhoneFromLid(sock, oldLid, msg);
                            
                            if (newJid && newJid.includes('@s.whatsapp.net')) {
                                lidToJid.set(oldLid, newJid);
                                senderNumber = newJid;
                                
                                // Move all existing messages to the real JID
                                await prisma.message.updateMany({
                                    where: { botId, chatId: oldLid },
                                    data: { chatId: newJid }
                                });
                                
                                // Update the LID contact to point to the real JID
                                const existingContact = await prisma.contact.findUnique({ where: { botId_chatId: { botId, chatId: oldLid } } });
                                let updatedContact = null;
                                if (existingContact) {
                                    updatedContact = await prisma.contact.update({
                                        where: { botId_chatId: { botId, chatId: oldLid } },
                                        data: { realJid: newJid, name: msg.pushName || existingContact.name }
                                    });
                                } else {
                                    updatedContact = await prisma.contact.create({
                                        data: { botId, chatId: oldLid, realJid: newJid, name: msg.pushName || 'Contact' }
                                    });
                                }
                                if (updatedContact) io.emit(`contact-update-${botId}`, updatedContact);
                            }
                        }
                    } catch(e) {
                        console.log(`[LID MISS] Error looking up/resolving LID ${senderNumber}:`, e)
                    }
                }
            }

            const isFromMe = msg.key.fromMe
            const pushName = isFromMe ? '' : (msg.pushName || contactNames.get(senderNumber) || '')

            // Debug logging to find real JID
            if (senderNumber.includes('@lid')) {
                console.log(`[LID DEBUG] Received message from LID ${senderNumber}. Message object:`, JSON.stringify(msg, null, 2))
            }

            // Если номер в формате @lid, попробуем поискать реальный JID в сообщении (иногда он есть в metadata)
            // Но проще всего - если у нас есть имя, сохраним его сразу в базу контактов если его там нет
            if (pushName) {
                try {
                    const existingContact = await prisma.contact.findUnique({
                        where: { botId_chatId: { botId, chatId: senderNumber } }
                    });
                    if (!existingContact || existingContact.name === 'Contact' || !existingContact.name) {
                        await prisma.contact.upsert({
                            where: { botId_chatId: { botId, chatId: senderNumber } },
                            update: { name: pushName },
                            create: { botId, chatId: senderNumber, name: pushName }
                        })
                    }
                } catch (e) {}
            }

            if (isFromMe && senderNumber.includes('@s.whatsapp.net')) {
                console.log(`[JID OUTGOING DEBUG] Sent message to ${senderNumber}. Full object:`, JSON.stringify(msg, (key, value) => key === 'message' ? undefined : value, 2))
                console.log(`[JID OUTGOING DEBUG] Context Info:`, JSON.stringify(msg.message?.extendedTextMessage?.contextInfo || msg.message?.conversation || 'No context', null, 2))
                
                const contextParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;
                if (contextParticipant && contextParticipant.includes('@lid')) {
                    const lid = contextParticipant;
                    const jid = senderNumber;
                    console.log(`[MAGIC LINK] Found mapping via owner reply! LID: ${lid} -> JID: ${jid}`);
                    lidToJid.set(lid, jid);
                    try {
                        await prisma.message.updateMany({
                            where: { botId, chatId: lid },
                            data: { chatId: jid }
                        })
                        await prisma.contact.upsert({
                            where: { botId_chatId: { botId, chatId: lid } },
                            update: { realJid: jid },
                            create: { botId, chatId: lid, realJid: jid, name: 'Contact' }
                        })
                    } catch(e) {}
                }
            }

            let textMessage = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
            let audioBuffer = null;
            let audioMimeType = null;

            if (msg.message.audioMessage || msg.message.ptvMessage) {
                const mediaMsg = msg.message.audioMessage || msg.message.ptvMessage;
                try {
                    const { downloadMediaMessage } = await import('@whiskeysockets/baileys');
                    audioBuffer = await downloadMediaMessage(msg, 'buffer', {}, { logger: pino({ level: 'silent' }) });
                    audioMimeType = mediaMsg.mimetype || 'audio/ogg';
                    const ext = audioMimeType.includes('mp4') ? 'mp4' : 'ogg';
                    const filename = `wa_audio_${Date.now()}_${Math.floor(Math.random()*1000)}.${ext}`;
                    const filepath = path.join(__dirname, '../../uploads', filename);
                    fs.writeFileSync(filepath, audioBuffer);
                    
                    const audioTag = `[AUDIO]/uploads/${filename}`;
                    textMessage = textMessage ? `${textMessage}\n${audioTag}` : audioTag;
                    console.log(`[WhatsApp Bot ${botId}] Downloaded audio to ${filename}`);
                } catch (e) {
                    console.error(`[WhatsApp Bot ${botId}] Error downloading audio:`, e);
                }
            }
            
            if (!textMessage && !audioBuffer) return

            console.log(`[WhatsApp Bot ${botId}] ${isFromMe ? 'Sent to' : 'Received from'} ${senderNumber}: ${textMessage}`)

            // Предотвращаем дублирование сообщений (если это сообщение от ИИ, которое возвращается нам же через вебсокет Baileys)
            if (isFromMe) {
                try {
                    const lastMsg = await prisma.message.findFirst({
                        where: { botId, chatId: senderNumber, sender: 'bot' },
                        orderBy: { createdAt: 'desc' }
                    });
                    if (lastMsg && lastMsg.text === textMessage && (new Date() - new Date(lastMsg.createdAt) < 60000)) {
                        // Это дубликат сообщения, которое ИИ только что сохранил в базу. Игнорируем.
                        return;
                    }
                } catch (e) {}
            }

            // Сохраняем сообщение в базу
            try {
                const savedMsg = await prisma.message.create({
                    // Если fromMe === true, значит владелец сам ответил с телефона. Помечаем как 'bot', чтобы в UI было справа
                    data: { botId, sender: isFromMe ? 'bot' : 'user', text: textMessage, chatId: senderNumber }
                })
                // Отправляем сообщение + имя контакта для фронтенда
                io.emit(`chat-${botId}`, { ...savedMsg, contactName: pushName })
            } catch (dbErr) { console.error('DB Error saving msg:', dbErr) }

            // Если сообщение отправлено нами (с телефона), ИИ не должен на него отвечать самому себе!
            if (isFromMe) return

            // Fetch latest bot state to check if AI is paused for this chat
            const currentBotState = await prisma.bot.findUnique({ where: { id: botId } });
            if (!currentBotState || !currentBotState.isActive) return;

        // Fetch last 20 messages for context history (10 user + 10 bot)
        const recentMessages = await prisma.message.findMany({
            where: { botId, chatId: senderNumber },
            orderBy: { createdAt: 'desc' },
            take: 20
        });
        recentMessages.reverse();

        // Prepare AI prompt using Gemini
        // GeminiService handles greeting logic automatically based on history presence
        const systemInstruction = `${currentBotState.system_prompt || ''}\n\nCRITICAL: Follow the system instructions exactly. Pay extreme attention to any [Correction] or [IMPORTANT CORRECTION] tags at the end of the instructions.`;
        const ragContext = currentBotState.data_prompt || '';

        const history = recentMessages.slice(0, -1).map(msg => ({
            role: msg.sender === 'bot' ? 'model' : 'user',
            parts: [{ text: msg.text }]
        }));
        const userMessage = recentMessages.length > 0 ? recentMessages[recentMessages.length - 1].text : '';

        try {
            // Check if user has messages
            const userId = currentBotState.user_id;
            const canProceed = await hasEnoughMessages(userId);
            if (!canProceed) {
                await sock.sendMessage(senderNumber, { text: "Баланс сообщений исчерпан. Пополните баланс в панели управления." });
                return;
            }

            // Call Gemini
            const geminiResult = await generateGeminiResponse(userMessage, history, systemInstruction, ragContext, audioBuffer, audioMimeType);
            const aiResponseText = geminiResult.text;

            // Track usage with existing trackUsage function
            await trackUsage({
                userId,
                botId,
                provider: 'vertex-ai',
                inputTokens: geminiResult.inputTokens,
                outputTokens: geminiResult.outputTokens,
                model: geminiResult.model,
            });
            console.log(`[WhatsApp Bot ${botId}] Gemini usage: in=${geminiResult.inputTokens} out=${geminiResult.outputTokens}`);
            console.log(`[WhatsApp Bot ${botId}] Answering: ${aiResponseText}`);

            // Reply on WhatsApp (messages.upsert will automatically trigger and save the echo to DB)
            await sock.sendMessage(senderNumber, { text: aiResponseText })

        } catch (error) {
            console.error(`[WhatsApp Bot ${botId}] AI Error:`, error.message)
            await sock.sendMessage(senderNumber, { text: "Error connecting to AI. Gemini integration is temporarily unavailable." })
        }
    } catch (err) {
        console.error(`[WhatsApp Bot ${botId}] messages.upsert error:`, err)
    }
})

    return sock
}

export const getWhatsAppSession = (botId) => {
    return sessions.get(botId)
}

export const stopWhatsAppBot = async (botId, logoutAndDestroy = false) => {
    const sock = sessions.get(botId)
    if (sock) {
        try { 
            sock.ev.removeAllListeners();
            if (logoutAndDestroy) {
                await sock.logout();
            } else {
                sock.ws.close();
            }
        } catch (e) {
            console.error(`[WhatsApp Bot ${botId}] Error stopping bot:`, e)
        }
        sessions.delete(botId)
        console.log(`[WhatsApp Bot ${botId}] Stopped and socket closed. Logout: ${logoutAndDestroy}`)
    }
}
