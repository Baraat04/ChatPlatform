import { makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers } from '@whiskeysockets/baileys'
import pino from 'pino'
import { Boom } from '@hapi/boom'

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

    sock.ev.on('contacts.upsert', async (contacts) => {
        console.log(`[WhatsApp Bot ${botId}] Received ${contacts.length} contacts via upsert`)
        for (const contact of contacts) {
            const name = contact.name || contact.notify || contact.verifiedName
            const jid = contact.id
            const lid = contact.lid

            if (lid && jid && jid.includes('@s.whatsapp.net')) {
                lidToJid.set(lid, jid)
                try {
                    await prisma.message.updateMany({
                        where: { botId, chatId: lid },
                        data: { chatId: jid }
                    })
                    await prisma.contact.upsert({
                        where: { botId_chatId: { botId, chatId: lid } },
                        update: { realJid: jid, name: name || 'Contact' },
                        create: { botId, chatId: lid, realJid: jid, name: name || 'Contact' }
                    })
                } catch (e) {}
            }

            if (name && jid) {
                contactNames.set(jid, name)
                try {
                    await prisma.contact.upsert({
                        where: { botId_chatId: { botId, chatId: jid } },
                        update: { name },
                        create: { botId, chatId: jid, name }
                    })
                } catch (e) {}
            }
        }
    })

    // Добавляем обработку начальной истории
    sock.ev.on('messaging-history.set', async ({ chats, contacts }) => {
        console.log(`[WhatsApp Bot ${botId}] Initial history: ${chats?.length || 0} chats, ${contacts?.length || 0} contacts`)
        if (contacts) {
            for (const contact of contacts) {
                const name = contact.name || contact.notify || contact.verifiedName
                const jid = contact.id
                const lid = contact.lid

                if (lid && jid && jid.includes('@s.whatsapp.net')) {
                    lidToJid.set(lid, jid)
                    try {
                        await prisma.message.updateMany({
                            where: { botId, chatId: lid },
                            data: { chatId: jid }
                        })
                        await prisma.contact.upsert({
                            where: { botId_chatId: { botId, chatId: lid } },
                            update: { realJid: jid, name: name || 'Contact' },
                            create: { botId, chatId: lid, realJid: jid, name: name || 'Contact' }
                        })
                    } catch (e) {}
                }

                if (name && jid) {
                    try {
                        await prisma.contact.upsert({
                            where: { botId_chatId: { botId, chatId: jid } },
                            update: { name },
                            create: { botId, chatId: jid, name }
                        })
                    } catch (e) {}
                }
            }
        }
    })

    sock.ev.on('contacts.update', async (updates) => {
        console.log(`[WhatsApp Bot ${botId}] Received ${updates.length} contact updates`)
        for (const update of updates) {
            const name = update.name || update.notify || update.verifiedName
            const jid = update.id
            const lid = update.lid

            if (lid && jid && jid.includes('@s.whatsapp.net')) {
                lidToJid.set(lid, jid)
                try {
                    await prisma.message.updateMany({
                        where: { botId, chatId: lid },
                        data: { chatId: jid }
                    })
                    await prisma.contact.upsert({
                        where: { botId_chatId: { botId, chatId: lid } },
                        update: { realJid: jid, name: name || 'Contact' },
                        create: { botId, chatId: lid, realJid: jid, name: name || 'Contact' }
                    })
                } catch (e) {}
            }

            if (name && jid) {
                contactNames.set(jid, name)
                try {
                    await prisma.contact.upsert({
                        where: { botId_chatId: { botId, chatId: jid } },
                        update: { name },
                        create: { botId, chatId: jid, name }
                    })
                } catch (e) {}
            }
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
                            create: { botId, chatId: oldLid, realJid: possibleJid, name: pushName || 'Contact' }
                        })
                    } catch (e) {}
                } else if (lidToJid.has(senderNumber)) {
                    const mappedJid = lidToJid.get(senderNumber)
                    console.log(`[LID MATCH] Mapping LID ${senderNumber} to JID ${mappedJid}`)
                    senderNumber = mappedJid
                } else {
                    console.log(`[LID MISS] No mapping found for LID ${senderNumber}. Known LIDs: ${Array.from(lidToJid.keys()).join(', ')}`)
                }
            }

            const isFromMe = msg.key.fromMe
            const pushName = msg.pushName || contactNames.get(senderNumber) || ''

            // Debug logging to find real JID
            if (senderNumber.includes('@lid')) {
                console.log(`[LID DEBUG] Received message from LID ${senderNumber}. Message object:`, JSON.stringify(msg, null, 2))
            }

            // Если номер в формате @lid, попробуем поискать реальный JID в сообщении (иногда он есть в metadata)
            // Но проще всего - если у нас есть имя, сохраним его сразу в базу контактов если его там нет
            if (pushName) {
                try {
                    await prisma.contact.upsert({
                        where: { botId_chatId: { botId, chatId: senderNumber } },
                        update: {}, // Не меняем если уже есть
                        create: { botId, chatId: senderNumber, name: pushName }
                    })
                } catch (e) {}
            }

            const textMessage = msg.message.conversation || msg.message.extendedTextMessage?.text
            
            if (!textMessage) return

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

        // Fetch last 100 messages for history
        const recentMessages = await prisma.message.findMany({
            where: { botId, chatId: senderNumber },
            orderBy: { createdAt: 'desc' },
            take: 100
        });
        recentMessages.reverse();

        // Prepare AI prompt
        let systemInstructionText = "System Instructions:\n";
        if (currentBotState.system_prompt) systemInstructionText += currentBotState.system_prompt + "\n\n";
        if (currentBotState.data_prompt) systemInstructionText += "Knowledge Base Data:\n" + currentBotState.data_prompt + "\n\n";
        systemInstructionText += "Follow the system instructions and use the knowledge base to answer the user.";

        const messagesPayload = [
            { role: "system", content: systemInstructionText }
        ];

        for (const msg of recentMessages) {
            messagesPayload.push({
                role: msg.sender === 'bot' ? 'assistant' : 'user',
                content: msg.text
            });
        }

        try {
            // Call LM Studio
            const aiResponse = await fetch("http://127.0.0.1:1234/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: "liquid/lfm2.5-1.2b",
                    messages: messagesPayload
                })
            })

            const aiData = await aiResponse.json()
            const aiResponseText = aiData.choices?.[0]?.message?.content || "Sorry, AI service is temporarily unavailable."

            console.log(`[WhatsApp Bot ${botId}] Answering: ${aiResponseText}`)

            // Reply on WhatsApp (messages.upsert will automatically trigger and save the echo to DB)
            await sock.sendMessage(senderNumber, { text: aiResponseText })

        } catch (error) {
            console.error(`[WhatsApp Bot ${botId}] AI Error:`, error.message)
            await sock.sendMessage(senderNumber, { text: "Error connecting to AI." })
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

export const stopWhatsAppBot = (botId) => {
    const sock = sessions.get(botId)
    if (sock) {
        try { sock.end() } catch (e) {}
        sessions.delete(botId)
        console.log(`[WhatsApp Bot ${botId}] Stopped by user.`)
    }
}
