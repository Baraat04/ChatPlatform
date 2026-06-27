import { makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers, fetchLatestBaileysVersion } from '@whiskeysockets/baileys'
import pino from 'pino'
import { Boom } from '@hapi/boom'
import { trackUsage, hasEnoughMessages } from './usage-tracker.js'
import { generateGeminiResponse } from './GeminiService.js';
import { sendManagerNotification, sendBalanceExhaustedEmail } from './emailService.js';
import { safeSendMessage } from './whatsapp-antiban.js';
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import qrcode from 'qrcode'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const sessions = new Map() // botId -> socket

// ─── GLOBAL AI CONCURRENCY QUEUE ─────────────────────────────────────────────
// Limits how many simultaneous Gemini AI calls run at once.
// Excess calls wait in queue — they are NOT dropped.
// This prevents Vertex AI rate limit (429) when many users write simultaneously.
const MAX_CONCURRENT_AI = 6; // max parallel Gemini calls
let _activeAiCalls = 0;
const _aiQueue = []; // Array of { fn: async () => any, resolve, reject }

/**
 * Runs fn() immediately if a concurrency slot is free.
 * Otherwise queues it and runs when a slot opens up.
 * Guarantees every call eventually runs — nothing is dropped.
 */
function scheduleAiCall(fn) {
    return new Promise((resolve, reject) => {
        const execute = async () => {
            _activeAiCalls++;
            try {
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('AI Request Timeout')), 60000));
                resolve(await Promise.race([fn(), timeoutPromise]));
            } catch (err) {
                reject(err);
            } finally {
                _activeAiCalls--;
                // Kick off next queued item if any
                if (_aiQueue.length > 0) {
                    const next = _aiQueue.shift();
                    next();
                }
            }
        };

        if (_activeAiCalls < MAX_CONCURRENT_AI) {
            execute(); // slot free — run immediately
        } else {
            _aiQueue.push(execute); // no slot — queue for later
            console.log(`[AI Queue] Queued. Active: ${_activeAiCalls}/${MAX_CONCURRENT_AI}, Waiting: ${_aiQueue.length}`);
        }
    });
}

// Per-chat processing lock: prevent SAME CHAT from being processed twice simultaneously
const chatProcessingLock = new Map(); // lockKey -> true
// ─────────────────────────────────────────────────────────────────────────────

export const startWhatsAppBot = async (bot, prisma, io, channel = null) => {
    const botId = bot.id
    const sessionId = channel ? `ch_${channel.id}` : botId;

    if (sessions.has(sessionId)) {
        console.log(`WhatsApp session ${sessionId} is already running.`)
        return sessions.get(sessionId)
    }

    const sessionDir = path.join(__dirname, `../../sessions/session_${sessionId}`)
    if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir, { recursive: true })
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir)
    const { version, isLatest } = await fetchLatestBaileysVersion()
    console.log(`[WhatsApp Bot ${botId}] Using WA v${version.join('.')}, isLatest: ${isLatest}`)

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }), // change to 'debug' for detailed logs
        version,
        browser: Browsers.windows('Chrome'),
        markOnlineOnConnect: true,
        syncFullHistory: false,
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 60000,
        keepAliveIntervalMs: 15000
    })

    sessions.set(sessionId, sock)
    sock._saveCreds = saveCreds // Store saveCreds to forcefully flush on shutdown

    // Flag to prevent auto-reconnect when intentionally stopped/deleted
    let intentionallyStopped = false;

    let lidToJid = new Map()
    try {
        const contactsWithLid = await prisma.contact.findMany({
            where: { botId, chatId: { contains: '@lid' }, realJid: { not: null } }
        })
        contactsWithLid.forEach(c => lidToJid.set(c.chatId, c.realJid))
        console.log(`[WhatsApp Bot ${botId}] Loaded ${lidToJid.size} LID mappings from DB`)
    } catch (e) { }

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
                } catch (e) { }
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
                } catch (e) { }
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
                    } catch (e) { }
                }
            }

            // 4. whatsapp-web.js specific methods (Fallback if client supports)
            if (!jid && typeof sock.getContactLidAndPhone === 'function') {
                try {
                    const res = await sock.getContactLidAndPhone([lid]);
                    if (res && res[lid]) { jid = res[lid]; strategy = 'getContactLidAndPhone'; }
                } catch (e) { }
            }
            if (!jid && typeof sock.getContactById === 'function') {
                try {
                    const contact = await sock.getContactById(lid);
                    if (contact && contact.number) { jid = `${contact.number}@s.whatsapp.net`; strategy = 'getContactById'; }
                } catch (e) { }
            }

            // 5. Triggers to force server update
            if (!jid) {
                try { await sock.profilePictureUrl(lid); } catch (e) { }
                await new Promise(r => setTimeout(r, 500));
                try { await sock.fetchStatus(lid); } catch (e) { }

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

                // FIX: If QR code is generated, the session is not connected.
                // We must update the DB to reflect this, so it doesn't show as a "zombie" connected channel.
                try {
                    if (channel) {
                        await prisma.channel.update({ where: { id: channel.id }, data: { isActive: false } });
                    } else {
                        const activeChannels = await prisma.channel.count({ where: { botId, isActive: true } });
                        if (activeChannels === 0) {
                            await prisma.bot.update({ where: { id: botId }, data: { isActive: false } });
                        }
                    }
                } catch(e) {
                    console.error(`[WhatsApp Bot ${botId}] Error updating DB on QR:`, e);
                }
            }

            if (connection === 'close') {
                const statusCode = (lastDisconnect?.error instanceof Boom) ? lastDisconnect.error.output?.statusCode : undefined;
                const shouldReconnect = !sock._intentionallyStopped && statusCode !== DisconnectReason.loggedOut && statusCode !== 405;

                console.log(`[WhatsApp Session ${sessionId}] connection closed due to`, lastDisconnect?.error, ', reconnecting:', shouldReconnect)

                sessions.delete(sessionId)

                if (shouldReconnect) {
                    setTimeout(() => startWhatsAppBot(bot, prisma, io, channel).catch(console.error), 3000)
                } else if (statusCode === DisconnectReason.loggedOut || statusCode === 405) {
                    console.log(`[WhatsApp Session ${sessionId}] Logged out. Notifying UI.`)
                    io.emit(`status-${botId}`, 'logged_out')
                    try {
                        if (channel) {
                            await prisma.channel.update({ where: { id: channel.id }, data: { isActive: false } });
                        } else {
                            const activeChannels = await prisma.channel.count({ where: { botId, isActive: true } });
                            if (activeChannels === 0) {
                                await prisma.bot.update({ where: { id: botId }, data: { isActive: false } });
                            }
                        }
                    } catch(e) {
                        console.error(`[WhatsApp Bot ${botId}] Error updating DB on logout:`, e);
                    }
                } else {
                    // Intentionally stopped — no reconnect, no QR
                    io.emit(`status-${botId}`, 'disconnected')
                }
            } else if (connection === 'open') {
                console.log(`[WhatsApp Session ${sessionId}] Connected!`)
                // CRITICAL FIX: Always mark bot as active so AI starts responding
                try {
                    await prisma.bot.update({
                        where: { id: botId },
                        data: { isActive: true }
                    });
                } catch (e) { console.error('[WA] Failed to set bot isActive=true:', e); }
                if (channel) {
                    try {
                        await prisma.channel.update({
                            where: { id: channel.id },
                            data: { isActive: true }
                        });
                    } catch (e) { }
                }
                io.emit(`status-${botId}`, 'connected')
                // Ensure session appears online so messages are delivered
                try { await sock.sendPresenceUpdate('available'); } catch (_) {}
            }
        } catch (err) {
            console.error(`[WhatsApp Bot ${botId}] connection.update error:`, err)
        }
    })

    sock.ev.on('messages.upsert', async (m) => {
        // CRITICAL: Only process real-time incoming messages.
        // 'append' = historical sync on reconnect — must NOT trigger AI responses!
        if (m.type === 'append') return; // Skip history sync

        // Process ALL messages in the batch (not just [0])
        // Baileys can batch multiple messages in one event
        for (const msg of m.messages) {
            if (!msg.message) continue // Ignore empty

            let senderNumber = msg.key.remoteJid
            // РРіРЅРѕСЂРёСЂСѓРµРј технические рассылки статусов
            if (senderNumber === 'status@broadcast') continue

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
                    } catch (e) { }
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
                    } catch (e) {
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
                } catch (e) { }
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
                    } catch (e) { }
                }
            }

            let textMessage = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
            let audioBuffer = null;
            let audioMimeType = null;
            let mediaUrl = null;
            let mediaType = null;

            if (msg.message.audioMessage || msg.message.ptvMessage) {
                const mediaMsg = msg.message.audioMessage || msg.message.ptvMessage;
                try {
                    const { downloadMediaMessage } = await import('@whiskeysockets/baileys');
                    audioBuffer = await downloadMediaMessage(msg, 'buffer', {}, { logger: pino({ level: 'silent' }) });
                    audioMimeType = mediaMsg.mimetype || 'audio/ogg';
                    const ext = audioMimeType.includes('mp4') ? 'mp4' : 'ogg';
                    const filename = `wa_audio_${Date.now()}_${Math.floor(Math.random() * 1000)}.${ext}`;
                    const filepath = path.join(__dirname, '../../uploads', filename);
                    fs.writeFileSync(filepath, audioBuffer);

                    mediaUrl = `/uploads/${filename}`;
                    mediaType = 'audio';
                    const audioTag = `[AUDIO]/uploads/${filename}`;
                    textMessage = textMessage ? `${textMessage}\n${audioTag}` : audioTag;
                    console.log(`[WhatsApp Bot ${botId}] Downloaded audio to ${filename}`);
                } catch (e) {
                    console.error(`[WhatsApp Bot ${botId}] Error downloading audio:`, e);
                }
            } else if (msg.message.imageMessage) {
                const mediaMsg = msg.message.imageMessage;
                try {
                    const { downloadMediaMessage } = await import('@whiskeysockets/baileys');
                    const buffer = await downloadMediaMessage(msg, 'buffer', {}, { logger: pino({ level: 'silent' }) });
                    const mimetype = mediaMsg.mimetype || 'image/jpeg';
                    const ext = mimetype.split('/')[1] || 'jpg';
                    const filename = `wa_image_${Date.now()}_${Math.floor(Math.random() * 1000)}.${ext}`;
                    const filepath = path.join(__dirname, '../../uploads', filename);
                    fs.writeFileSync(filepath, buffer);

                    mediaUrl = `/uploads/${filename}`;
                    mediaType = 'image';
                    textMessage = mediaMsg.caption || textMessage || '';
                    console.log(`[WhatsApp Bot ${botId}] Downloaded image to ${filename}`);
                } catch (e) {
                    console.error(`[WhatsApp Bot ${botId}] Error downloading image:`, e);
                }
            } else if (msg.message.documentMessage) {
                const mediaMsg = msg.message.documentMessage;
                try {
                    const { downloadMediaMessage } = await import('@whiskeysockets/baileys');
                    const buffer = await downloadMediaMessage(msg, 'buffer', {}, { logger: pino({ level: 'silent' }) });
                    const mimetype = mediaMsg.mimetype || 'application/octet-stream';

                    let originalName = mediaMsg.fileName || 'document';
                    let ext = path.extname(originalName) || '';
                    if (!ext) {
                        ext = mimetype.split('/')[1] || '';
                        if (ext) ext = '.' + ext;
                    }
                    const cleanBaseName = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
                    const filename = `wa_doc_${Date.now()}_${cleanBaseName}${ext}`;
                    const filepath = path.join(__dirname, '../../uploads', filename);
                    fs.writeFileSync(filepath, buffer);

                    mediaUrl = `/uploads/${filename}`;
                    mediaType = 'document';
                    textMessage = mediaMsg.caption || originalName;
                    console.log(`[WhatsApp Bot ${botId}] Downloaded document to ${filename}`);
                } catch (e) {
                    console.error(`[WhatsApp Bot ${botId}] Error downloading document:`, e);
                }
            }

            if (!textMessage && !audioBuffer && !mediaUrl) return

            console.log(`[WhatsApp Bot ${botId}] ${isFromMe ? 'Sent to' : 'Received from'} ${senderNumber}: ${textMessage}`)

            // Предотвращаем дублирование сообщений (если это сообщение от РР, которое возвращается нам же через вебсокет Baileys)
            if (isFromMe) {
                try {
                    const lastMsg = await prisma.message.findFirst({
                        where: { botId, chatId: senderNumber, sender: 'bot' },
                        orderBy: { createdAt: 'desc' }
                    });
                    const textMatch = lastMsg && lastMsg.text === textMessage;
                    const mediaMatch = lastMsg && lastMsg.mediaType && mediaType && lastMsg.mediaType === mediaType;
                    if (lastMsg && (textMatch || mediaMatch) && (new Date() - new Date(lastMsg.createdAt) < 60000)) {
                        // Это дубликат сообщения, которое РР только что сохранил в базу. РРіРЅРѕСЂРёСЂСѓРµРј.
                        return;
                    }
                } catch (e) { }
            }

            // Сохраняем сообщение в базу
            try {
                const savedMsg = await prisma.message.create({
                    // Если fromMe === true, значит владелец сам ответил с телефона. Помечаем как 'bot', чтобы в UI было справа
                    data: { botId, channelId: channel ? channel.id : null, platform: 'WHATSAPP', sender: isFromMe ? 'bot' : 'user', text: textMessage, chatId: senderNumber, mediaUrl, mediaType }
                })
                // Отправляем сообщение + имя контакта для фронтенда
                io.emit(`chat-${botId}`, { ...savedMsg, contactName: pushName })
            } catch (dbErr) { console.error('DB Error saving msg:', dbErr) }

            // Если сообщение отправлено нами (с телефона), РР не должен на него отвечать самому себе!
            if (isFromMe) continue

            // Fetch latest bot state to check if AI is paused for this chat
            const currentBotState = await prisma.bot.findUnique({ where: { id: botId } });
            if (!currentBotState || !currentBotState.isActive) continue;

            if (channel) {
                const currentChannelState = await prisma.channel.findUnique({ where: { id: channel.id } });
                if (!currentChannelState || !currentChannelState.isActive) continue;
            }

            if ((currentBotState.pausedChats || []).includes(senderNumber) || (currentBotState.pausedChats || []).includes(msg.key.remoteJid)) continue;

            // Per-chat lock: prevent parallel processing of the same chat (race condition guard)
            const lockKey = `${sessionId}:${senderNumber}`;
            if (chatProcessingLock.get(lockKey)) {
                console.log(`[WhatsApp Bot ${botId}] Chat ${senderNumber} is already being processed. Skipping duplicate.`);
                continue;
            }
            chatProcessingLock.set(lockKey, true);

            const recentMessages = await prisma.message.findMany({
                where: { botId, chatId: senderNumber },
                orderBy: { createdAt: 'desc' },
                take: 20
            });
            recentMessages.reverse();

            // Prepare AI prompt using Gemini
            // GeminiService handles greeting logic automatically based on history presence
            const realPhone = senderNumber.split('@')[0];
            let systemInstruction = `${currentBotState.system_prompt || ''}\n\n[РЎРРЎРўР•РњРќРђРЇ РРќР¤РћР РњРђР¦РРЇ]:\nНомер телефона клиента, с которым вы сейчас общаетесь: +${realPhone}\nЕсли клиент просит записать его на "этот номер" или "мой номер", вы обязаны использовать именно этот номер (+${realPhone}) в инструментах!\n\nCRITICAL: Follow the system instructions exactly. Pay extreme attention to any [Correction] or [IMPORTANT CORRECTION] tags at the end of the instructions.`;

            // Setup integration config
            const integrationConfig = {
                googleSheetUrl: currentBotState.googleSheetUrl,
                googleSheetColumns: currentBotState.googleSheetColumns,
                bitrixWebhookUrl: currentBotState.bitrixWebhookUrl,
                bitrixFields: currentBotState.bitrixFields,
                googleCalendarId: currentBotState.googleCalendarId
            };

            const ragContext = currentBotState.data_prompt || '';

            const history = recentMessages.slice(0, -1).map(msg => ({
                role: msg.sender === 'bot' ? 'model' : 'user',
                parts: [{ text: (msg.text || '').replace(/\[AUDIO\]\/uploads\/[^\s\n]+/g, '').trim() }]
            }));
            let userMessage = recentMessages.length > 0 ? recentMessages[recentMessages.length - 1].text : '';
            if (userMessage) userMessage = userMessage.replace(/\[AUDIO\]\/uploads\/[^\s\n]+/g, '').trim();

            try {
                // Check if user has messages
                const userId = currentBotState.user_id;
                const canProceed = await hasEnoughMessages(userId);
                if (!canProceed) {
                    try {
                        const ownerUser = await prisma.user.findUnique({
                            where: { id: userId },
                            select: { email: true, name: true }
                        });
                        
                        await prisma.bot.update({
                            where: { id: botId },
                            data: { isActive: false }
                        });
                        
                        io.emit(`bot-update-${botId}`, { isActive: false });
                        
                        if (ownerUser?.email) {
                            sendBalanceExhaustedEmail(ownerUser.email, ownerUser.name, currentBotState.name || `Bot #${botId}`);
                        }
                    } catch (e) { console.error('[WA] Error on balance exhausted:', e); }
                    continue;
                }

                // Wrap entire AI processing in the global concurrency queue
                // This ensures all users get responses — excess requests WAIT, not dropped
                await scheduleAiCall(async () => {

                    // Call Gemini with function calling enabled
                    const geminiResult = await generateGeminiResponse(
                        userMessage,
                        history,
                        systemInstruction,
                        ragContext,
                        audioBuffer,
                        audioMimeType,
                        integrationConfig
                    );

                    let aiResponseText = geminiResult.text;

                    if (geminiResult.shouldPauseChat) {
                        let pausedChats = currentBotState.pausedChats || [];
                        if (!pausedChats.includes(senderNumber)) {
                            pausedChats.push(senderNumber);
                            await prisma.bot.update({
                                where: { id: botId },
                                data: { pausedChats }
                            });
                        }
                        try {
                            const contact = await prisma.contact.update({
                                where: { botId_chatId: { botId, chatId: senderNumber } },
                                data: { status: 'Нужен ответ' }
                            });
                            io.emit(`contact-update-${botId}`, contact);
                            io.emit(`bot-update-${botId}`, { pausedChats });

                            // Notify bot owner by email
                            const ownerUser = await prisma.user.findUnique({
                                where: { id: currentBotState.user_id },
                                select: { email: true, name: true }
                            });
                            if (ownerUser?.email) {
                                const contactName = contact.name || senderNumber.split('@')[0];
                                sendManagerNotification(ownerUser.email, contactName, currentBotState.name || `Bot #${botId}`);
                            }
                        } catch (e) { console.error('[WA] Error notifying manager:', e); }
                    } else if (geminiResult.achievedGoal) {
                        try {
                            const contact = await prisma.contact.update({
                                where: { botId_chatId: { botId, chatId: senderNumber } },
                                data: { status: 'Успех', funnelStage: 'Успешно' }
                            });
                            io.emit(`contact-update-${botId}`, contact);
                        } catch (e) { }
                    }

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
                    console.log(`[WhatsApp Bot ${botId}] Answering ${senderNumber}: ${aiResponseText?.substring(0, 60)}...`);

                    // Reply on WhatsApp
                    if (aiResponseText && aiResponseText.trim()) {
                        let waSendResult = null;
                        try {
                            // Ensure session is online before sending
                            try { await sock.sendPresenceUpdate('available'); } catch (_) {}
                            
                            // Anti-ban: show typing indicator before replying (human-like)
                            waSendResult = await safeSendMessage(sock, senderNumber, { text: aiResponseText }, {
                                showTyping: true,
                                typingText: aiResponseText,
                                sendReadReceipt: false // already saw the message
                            });
                            console.log(`[WhatsApp Bot ${botId}] safeSendMessage result for ${senderNumber}:`, waSendResult?.key?.id ? `OK msgId=${waSendResult.key.id}` : 'NO KEY RETURNED');
                        } catch (sendErr) {
                            console.error(`[WhatsApp Bot ${botId}] safeSendMessage FAILED for ${senderNumber}:`, sendErr.message);
                            // Fallback: try direct send without anti-ban wrapper
                            try {
                                waSendResult = await sock.sendMessage(senderNumber, { text: aiResponseText });
                                console.log(`[WhatsApp Bot ${botId}] FALLBACK direct send result:`, waSendResult?.key?.id ? `OK msgId=${waSendResult.key.id}` : 'NO KEY');
                            } catch (directErr) {
                                console.error(`[WhatsApp Bot ${botId}] FALLBACK direct send also FAILED:`, directErr.message);
                            }
                        }

                        // Save AI response to DB so it instantly shows up in the frontend panel
                        try {
                            const savedAiMsg = await prisma.message.create({
                                data: { botId, channelId: channel ? channel.id : null, platform: 'WHATSAPP', sender: 'bot', text: aiResponseText, chatId: senderNumber }
                            });
                            io.emit(`chat-${botId}`, savedAiMsg);
                        } catch (e) { console.error('Failed to save AI message to DB:', e); }

                    } else {
                        console.log(`[WhatsApp Bot ${botId}] Empty AI response ignored. No message sent to ${senderNumber}`);
                    }

                }); // end scheduleAiCall

            } catch (error) {
                console.error(`[WhatsApp Bot ${botId}] AI Error for ${senderNumber}:`, error.message)
                const isRateLimit = (error.message || '').includes('429') || (error.message || '').includes('RESOURCE_EXHAUSTED') || (error.message || '').includes('quota');
                if (isRateLimit) {
                    console.error(`[WhatsApp Bot ${botId}] ⚠️ All retries exhausted for ${senderNumber}. Sending retry notice.`);
                    try { await sock.sendMessage(senderNumber, { text: "РР·РІРёРЅРёС‚Рµ, сервер перегружен. Пожалуйста, повторите запрос через несколько секунд." }); } catch (e) { }
                } else {
                    try { await sock.sendMessage(senderNumber, { text: "Произошла ошибка. Пожалуйста, попробуйте ещё раз.\n\nAn error occurred. Please try again.\n\nҚате пайда болды. Қайтадан байқап көріңіз." }); } catch (e) { }
                }
            } finally {
                // ALWAYS release the per-chat lock — no matter what happened
                chatProcessingLock.delete(lockKey);
            }

        } // end for (const msg of m.messages)
    }) // end messages.upsert


    return sock
}

export const getWhatsAppSession = (sessionId) => {
    return sessions.get(sessionId)
}

export const stopWhatsAppBot = async (sessionId, logoutAndDestroy = false) => {
    const sock = sessions.get(sessionId)
    if (sock) {
        // Set flag on the socket to prevent auto-reconnect
        sock._intentionallyStopped = true;
        try {
            sock.ev.removeAllListeners();
            if (logoutAndDestroy) {
                try { await sock.logout(); } catch (e) { }
                // Delete session files so QR scan is needed on next connect
                const sessionDir = path.join(path.dirname(fileURLToPath(import.meta.url)), `../../sessions/session_${sessionId}`)
                try { fs.rmSync(sessionDir, { recursive: true, force: true }) } catch (e) { }
            } else {
                try { sock.ws.close(); } catch (e) { }
            }
        } catch (e) {
            console.error(`[WhatsApp Session ${sessionId}] Error stopping session:`, e)
        }
        sessions.delete(sessionId)
        console.log(`[WhatsApp Session ${sessionId}] Stopped. Logout+delete: ${logoutAndDestroy}`)
    }
}

export const startWhatsAppChannel = async (channel, bot, prisma, io) => startWhatsAppBot(bot, prisma, io, channel);
export const stopWhatsAppChannel = async (channelId, logoutAndDestroy = false) => stopWhatsAppBot(`ch_${channelId}`, logoutAndDestroy);

export const closeAllSessions = async () => {
    for (const [sessionId, sock] of sessions.entries()) {
        try {
            if (sock._saveCreds) {
                await sock._saveCreds(); // Force flush all pending keys to disk
            }
            sock.ws.close();
            console.log(`[WhatsApp Session ${sessionId}] Closed gracefully on server shutdown.`);
        } catch (e) {
            console.error(`[WhatsApp Session ${sessionId}] Error closing:`, e.message);
        }
    }
};



