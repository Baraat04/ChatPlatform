/**
 * ============================================================
 *  WhatsApp Anti-Ban Protection Module
 * ============================================================
 *  Implements human-like behaviour to avoid WhatsApp bans
 *  when using unofficial API (Baileys).
 *
 *  Key protections:
 *  1. Random delays between messages (human typing speed)
 *  2. "Typing..." indicator before sending
 *  3. Read receipt simulation
 *  4. Batch size & hourly rate limits for broadcasts
 *  5. Random message order shuffling (for broadcasts)
 *  6. Activity window enforcement (no messages at night)
 * ============================================================
 */

// ── DELAY HELPERS ────────────────────────────────────────────

/**
 * Returns a random integer between min and max (inclusive).
 */
function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Sleeps for a random number of milliseconds in [minMs, maxMs].
 */
export function randomDelay(minMs, maxMs) {
    const ms = randInt(minMs, maxMs);
    return new Promise(r => setTimeout(r, ms));
}

/**
 * Calculates a human-like typing delay based on message length.
 * Simulates ~40-70 chars per second typing speed.
 * Capped at 6 seconds maximum.
 */
export function typingDelay(text = '') {
    const charsPerSecond = randInt(40, 70);
    const ms = Math.min((text.length / charsPerSecond) * 1000, 6000);
    // Add random human jitter ±500ms
    const jitter = randInt(-500, 500);
    return Math.max(500, ms + jitter);
}

// ── CORE ANTI-BAN SEND ───────────────────────────────────────

/**
 * Sends a WhatsApp message with full anti-ban protection:
 *  - Marks the chat as "read" before replying
 *  - Shows "typing..." indicator for a human-like duration
 *  - Sends the message
 *  - Adds a short post-send pause
 *
 * @param {object} sock       - Baileys socket
 * @param {string} jid        - Recipient JID
 * @param {object} content    - Message content (same as sock.sendMessage 2nd arg)
 * @param {object} [options]  - Options
 * @param {boolean} [options.sendReadReceipt=true]
 * @param {boolean} [options.showTyping=true]
 * @param {string}  [options.typingText=''] - Text used to calculate typing duration
 */
export async function safeSendMessage(sock, jid, content, options = {}) {
    const {
        sendReadReceipt = true,
        showTyping = true,
        typingText = content.text || content.caption || '',
    } = options;

    try {
        // 0. Ensure we appear online (required for message delivery in newer WA protocol)
        try {
            await sock.sendPresenceUpdate('available');
        } catch (_) { /* non-critical */ }

        // 1. Mark as read (looks like a real user reading before replying)
        if (sendReadReceipt) {
            try {
                await sock.readMessages([{ remoteJid: jid, id: 'latest', fromMe: false }]);
            } catch (_) { /* non-critical */ }
        }

        // 2. Short pre-typing pause (human picks up phone, reads message)
        await randomDelay(800, 2500);

        // 3. Show typing indicator
        if (showTyping) {
            try {
                await sock.sendPresenceUpdate('composing', jid);
            } catch (_) { /* non-critical */ }
            await new Promise(r => setTimeout(r, typingDelay(typingText)));
            try {
                await sock.sendPresenceUpdate('paused', jid);
            } catch (_) { /* non-critical */ }
        }

        // 4. Send the actual message
        const result = await sock.sendMessage(jid, content);

        // 5. Verify send result
        if (!result || !result.key || !result.key.id) {
            console.warn(`[AntiBan] WARNING: sendMessage returned empty result for ${jid}. Message may not have been delivered.`);
        }

        // 6. Short post-send pause (looks natural)
        await randomDelay(300, 800);

        return result;
    } catch (err) {
        console.error(`[AntiBan] safeSendMessage ERROR for ${jid}:`, err.message);
        throw err; // Re-throw so caller can handle
    }
}

// ── BROADCAST RATE LIMITER ───────────────────────────────────

/**
 * Anti-ban settings for broadcasts.
 * Tune these to balance speed vs. safety.
 */
export const BROADCAST_CONFIG = {
    // Delay between each recipient (ms)
    minDelayMs: 8_000,   //  8 seconds minimum
    maxDelayMs: 25_000,  // 25 seconds maximum

    // After this many messages, take a longer break
    batchSize: 15,
    batchBreakMinMs: 60_000,   // 1 minute
    batchBreakMaxMs: 180_000,  // 3 minutes

    // Max messages per session (safety ceiling)
    sessionLimit: 200,

    // Only send during these hours (24h, server local time)
    activeHourStart: 8,   // 08:00
    activeHourEnd: 22,    // 22:00
};

/**
 * Returns true if current time is within the allowed activity window.
 * Sending at 3am looks very bot-like.
 */
export function isActiveHour() {
    const hour = new Date().getHours();
    return hour >= BROADCAST_CONFIG.activeHourStart && hour < BROADCAST_CONFIG.activeHourEnd;
}

/**
 * Computes a human-like delay for broadcast messages.
 * Adds jitter so the pattern is never perfectly uniform.
 */
export function broadcastDelay(msgIndex) {
    const { minDelayMs, maxDelayMs, batchSize, batchBreakMinMs, batchBreakMaxMs } = BROADCAST_CONFIG;

    // Every `batchSize` messages — take a longer break
    if (msgIndex > 0 && msgIndex % batchSize === 0) {
        const breakMs = randInt(batchBreakMinMs, batchBreakMaxMs);
        console.log(`[AntiBan] 🛡️  Batch break after ${msgIndex} messages. Pausing ${Math.round(breakMs / 1000)}s...`);
        return breakMs;
    }

    // Normal inter-message delay with random jitter
    return randInt(minDelayMs, maxDelayMs);
}

/**
 * Shuffles an array in-place (Fisher-Yates).
 * Randomising recipient order makes the send pattern less predictable.
 */
export function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}
