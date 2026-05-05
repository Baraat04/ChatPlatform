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

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update

        if (qr) {
            console.log(`[WhatsApp Bot ${botId}] QR code generated`)
            // Convert to data URL to send to frontend
            const qrDataUrl = await qrcode.toDataURL(qr)
            io.emit(`qr-${botId}`, qrDataUrl)
        }

        if (connection === 'close') {
            const statusCode = (lastDisconnect.error instanceof Boom) ? lastDisconnect.error.output?.statusCode : undefined;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut && statusCode !== 405;
            
            console.log(`[WhatsApp Bot ${botId}] connection closed due to`, lastDisconnect.error, ', reconnecting:', shouldReconnect)
            
            sessions.delete(botId)
            
            if (shouldReconnect) {
                setTimeout(() => startWhatsAppBot(bot, prisma, io), 2000)
            } else {
                console.log(`[WhatsApp Bot ${botId}] Session invalid/logged out (Code ${statusCode}). Deleting session data.`)
                try { fs.rmSync(sessionDir, { recursive: true, force: true }) } catch (e) {}
                io.emit(`status-${botId}`, 'logged_out')
            }
        } else if (connection === 'open') {
            console.log(`[WhatsApp Bot ${botId}] Connected!`)
            io.emit(`status-${botId}`, 'connected')
        }
    })

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0]
        if (!msg.message || msg.key.fromMe) return // Ignore own messages or empty

        const senderNumber = msg.key.remoteJid  // Keep original - Baileys handles @lid natively
        const textMessage = msg.message.conversation || msg.message.extendedTextMessage?.text
        
        if (!textMessage) return

        console.log(`[WhatsApp Bot ${botId}] Received from ${senderNumber}: ${textMessage}`)

        // Save incoming message
        try {
            const incomingMsg = await prisma.message.create({
                data: { botId, sender: 'user', text: textMessage, chatId: senderNumber }
            })
            io.emit(`chat-${botId}`, incomingMsg)
        } catch (dbErr) { console.error('DB Error saving user msg:', dbErr) }

        // Fetch latest bot state to check if AI is paused for this chat
        const currentBotState = await prisma.bot.findUnique({ where: { id: botId } });
        if (!currentBotState || !currentBotState.isActive) return;

        // Prepare AI prompt
        let systemInstructionText = ""
        if (currentBotState.system_prompt) systemInstructionText += currentBotState.system_prompt + "\n\n"
        if (currentBotState.data_prompt) systemInstructionText += "Knowledge Base:\n" + currentBotState.data_prompt

        try {
            // Call LM Studio
            const aiResponse = await fetch("http://127.0.0.1:1234/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: "liquid/lfm2.5-1.2b",
                    messages: [
                        { role: "system", content: systemInstructionText },
                        { role: "user", content: textMessage }
                    ]
                })
            })

            const aiData = await aiResponse.json()
            const aiResponseText = aiData.choices?.[0]?.message?.content || "Sorry, AI service is temporarily unavailable."

            console.log(`[WhatsApp Bot ${botId}] Answering: ${aiResponseText}`)

            // Reply on WhatsApp
            await sock.sendMessage(senderNumber, { text: aiResponseText })

            // Save outgoing message
            try {
                const outgoingMsg = await prisma.message.create({
                    data: { botId, sender: 'bot', text: aiResponseText, chatId: senderNumber }
                })
                io.emit(`chat-${botId}`, outgoingMsg)
            } catch (dbErr) { console.error('DB Error saving bot msg:', dbErr) }

        } catch (error) {
            console.error(`[WhatsApp Bot ${botId}] AI Error:`, error.message)
            await sock.sendMessage(senderNumber, { text: "Error connecting to AI." })
        }
    })

    return sock
}

export const getWhatsAppSession = (botId) => {
    return sessions.get(botId)
}
