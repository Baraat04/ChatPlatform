import { generateGeminiResponse } from './GeminiService.js'

/**
 * Completion Checker — runs every N minutes, scans recent active chats,
 * and if AI determines (or keywords detect) the conversation goal was achieved,
 * sets status = "Успех" and funnelStage = "Успешно".
 */

// ─── KEYWORD-BASED FAST PATH ───────────────────────────────────────────────
// If the LAST BOT message contains any of these phrases → instantly mark Success
// This is instant and free (no API call needed)
const SUCCESS_PATTERNS = [
    /запись.*оформлена/i,
    /запись.*успешно/i,
    /записали.*вас/i,
    /вы.*записаны/i,
    /жд[её]м вас/i,
    /до встречи/i,
    /встретимся/i,
    /приходите/i,
    /заявка.*принята/i,
    /заявка.*оформлена/i,
    /заказ.*оформлен/i,
    /заказ.*подтвержд[её]н/i,
    /оплата.*прошла/i,
    /оплата.*подтверждена/i,
    /чек.*отправлен/i,
    /booking.*confirmed/i,
    /appointment.*confirmed/i,
    /успешно.*завершена/i
];

const SUCCESS_FUNNEL_STAGE = 'Успешно';
const SUCCESS_STATUS = 'Успех';

/**
 * Check if the last bot message in the conversation contains success keywords.
 * Returns true if success is detected.
 */
function detectSuccessByKeywords(messages) {
    // Look at last few bot messages (last 4)
    const botMessages = messages
        .filter(m => m.sender === 'bot' && m.text)
        .slice(-4);

    for (const msg of botMessages) {
        const text = msg.text;
        for (const pattern of SUCCESS_PATTERNS) {
            if (pattern.test(text)) {
                console.log(`[CompletionChecker] Keyword match: "${pattern}" in message: "${text.slice(0, 80)}"`);
                return true;
            }
        }
    }
    return false;
}

// ─── GEMINI PROMPT ─────────────────────────────────────────────────────────
const COMPLETION_PROMPT = `Ты — аналитик воронки продаж. Проанализируй диалог клиента с ботом.

ВАЖНО: Если бот написал что-то вроде "запись оформлена", "вы записаны", "ждем вас", "заказ принят" — это ОДНОЗНАЧНО "Успешно".

Ответь ТОЛЬКО JSON без markdown:
{
  "goalAchieved": true/false,
  "funnelStage": "<Лид | Квалификация | Презентация | Отработка возражений | Ожидание оплаты | Успешно | Отказ | Молчит>",
  "status": "<Успех | Лид | Нужен ответ | Думает | Ждет оплаты | Отказ>",
  "reason": "<1 предложение>"
}

Правила:
- "Успешно" + "Успех" если: бот подтвердил запись/покупку/заявку, или написал "ждем вас", "записали", "оформлена" и т.д.
- "Нужен ответ" СТРОГО ЗАПРЕЩЁН если ПОСЛЕДНЕЕ сообщение в диалоге — от БОТА. Если бот ответил последним — ставь "Лид" или "Думает", но НИКОГДА не "Нужен ответ".
- "Нужен ответ" — ТОЛЬКО если последнее сообщение от КЛИЕНТА и бот ещё не ответил.
- "Лид" — диалог только начат, клиент написал первое сообщение, бот уже ответил.
- "Отказ" — клиент явно отказался.
- "Молчит" — последнее сообщение от бота, клиент не ответил долго (более нескольких часов).

ПРИМЕРЫ:
КЛИЕНТ: "привет"
БОТ: "Здравствуйте! Я сотрудник компании. Чем могу помочь?"
→ funnelStage: "Лид", status: "Лид"  ← НЕ "Нужен ответ"! Бот уже ответил.

БОТ: "Запись успешно оформлена! Ждем вас 22 июня в 16:00."
→ funnelStage: "Успешно", status: "Успех"

БОТ: "Ваш заказ принят, доставка завтра."
→ funnelStage: "Успешно", status: "Успех"
`;

// ─── STATE ─────────────────────────────────────────────────────────────────
let _prisma = null;
let _io = null;

export function initCompletionChecker(prismaInstance, ioInstance) {
    _prisma = prismaInstance;
    _io = ioInstance;
}

// ─── MAIN FUNCTION ─────────────────────────────────────────────────────────
/**
 * Run completion check.
 * @param {number|null} filterBotId  — Only check contacts of this bot
 * @param {object|null} ioOverride   — Socket.io instance (from request context)
 * @param {string|null} filterChatId — Only check this specific chat
 */
export async function runCompletionCheck(filterBotId = null, ioOverride = null, filterChatId = null) {
    const prisma = _prisma;
    const io = ioOverride || _io;

    if (!prisma) {
        console.warn('[CompletionChecker] Not initialized yet.');
        return;
    }

    console.log(`[CompletionChecker] Running check... botId=${filterBotId || 'all'} chatId=${filterChatId || 'all'}`);

    try {
        const cutoffRecent = new Date(Date.now() - 6 * 60 * 60 * 1000); // 6 hours ago
        const cutoffIdle   = new Date(Date.now() - 5 * 60 * 1000);      // 5 minutes idle

        // Build contact filter
        const whereClause = {
            status: { notIn: [SUCCESS_STATUS, 'Отказ'] }
        };
        if (filterBotId)  whereClause.botId  = filterBotId;
        if (filterChatId) whereClause.chatId = filterChatId;
        else              whereClause.updatedAt = { gte: cutoffRecent };

        const contacts = await prisma.contact.findMany({
            where: whereClause,
            take: filterChatId ? 1 : 40
        });

        if (contacts.length === 0) {
            console.log('[CompletionChecker] No contacts to check.');
            return;
        }

        console.log(`[CompletionChecker] Checking ${contacts.length} contacts...`);

        for (const contact of contacts) {
            try {
                // Get messages
                const messages = await prisma.message.findMany({
                    where: { botId: contact.botId, chatId: contact.chatId },
                    orderBy: { createdAt: 'asc' },
                    take: 30
                });

                if (messages.length < 1) continue;

                const lastMsg = messages[messages.length - 1];

                // Skip very recent conversations (might still be ongoing) — unless forced
                if (!filterChatId && lastMsg.createdAt > cutoffIdle) continue;

                // ── FAST PATH: keyword detection ──────────────────────────────
                if (detectSuccessByKeywords(messages)) {
                    const updated = await prisma.contact.update({
                        where: { botId_chatId: { botId: contact.botId, chatId: contact.chatId } },
                        data: { status: SUCCESS_STATUS }
                    });
                    
                    await prisma.chatAnalytics.upsert({
                        where: { botId_chatId: { botId: contact.botId, chatId: contact.chatId } },
                        update: { funnelStage: SUCCESS_FUNNEL_STAGE, lastAnalyzed: new Date() },
                        create: { botId: contact.botId, chatId: contact.chatId, funnelStage: SUCCESS_FUNNEL_STAGE }
                    });

                    // Add funnelStage to emitted object for UI updates
                    updated.funnelStage = SUCCESS_FUNNEL_STAGE;

                    if (io) io.emit(`contact-update-${contact.botId}`, updated);
                    console.log(`[CompletionChecker] ✅ KEYWORD SUCCESS: ${contact.chatId}`);
                    continue; // No need to call Gemini
                }

                // ── SLOW PATH: Gemini analysis ────────────────────────────────
                if (messages.length < 2) continue;

                const historyText = messages
                    .map(m => `${m.sender === 'bot' ? 'БОТ' : 'КЛИЕНТ'}: ${m.text || '[медиафайл]'}`)
                    .join('\n');

                const result = await generateGeminiResponse(
                    `Проанализируй этот диалог:\n\n${historyText}`,
                    [],
                    COMPLETION_PROMPT,
                    ''
                );

                let parsed;
                try {
                    const jsonText = result.text.replace(/```json/g, '').replace(/```/g, '').trim();
                    parsed = JSON.parse(jsonText);
                } catch (e) {
                    console.warn(`[CompletionChecker] Bad JSON for ${contact.chatId}:`, result.text.slice(0, 200));
                    continue;
                }

                // Safety guard: if last message is from bot, "Нужен ответ" is logically impossible
                if (parsed.status === 'Нужен ответ' && lastMsg.sender === 'bot') {
                    console.log(`[CompletionChecker] Overriding incorrect "Нужен ответ" → "Лид" for ${contact.chatId} (last msg from bot)`);
                    parsed.status = 'Лид';
                }

                let updatedContact = contact;
                if (parsed.status) {
                    updatedContact = await prisma.contact.update({
                        where: { botId_chatId: { botId: contact.botId, chatId: contact.chatId } },
                        data: { status: parsed.status }
                    });
                }
                
                if (parsed.funnelStage) {
                    await prisma.chatAnalytics.upsert({
                        where: { botId_chatId: { botId: contact.botId, chatId: contact.chatId } },
                        update: { funnelStage: parsed.funnelStage, lastAnalyzed: new Date() },
                        create: { botId: contact.botId, chatId: contact.chatId, funnelStage: parsed.funnelStage }
                    });
                    updatedContact.funnelStage = parsed.funnelStage;
                }

                if (parsed.status || parsed.funnelStage) {
                    if (io) io.emit(`contact-update-${contact.botId}`, updatedContact);
                    console.log(`[CompletionChecker] Gemini → ${contact.chatId}: funnelStage=${parsed.funnelStage}, status=${parsed.status}`);
                }

            } catch (err) {
                console.error(`[CompletionChecker] Error on ${contact.chatId}:`, err.message);
            }
        }

        console.log('[CompletionChecker] Done.');
    } catch (err) {
        console.error('[CompletionChecker] Fatal error:', err.message);
    }
}

// ─── PERIODIC STARTER ──────────────────────────────────────────────────────
export function startCompletionChecker(prismaInstance, ioInstance, intervalMinutes = 15) {
    initCompletionChecker(prismaInstance, ioInstance);
    console.log(`[CompletionChecker] Started — will run every ${intervalMinutes} minutes.`);

    // First run after 2 min from startup
    setTimeout(() => runCompletionCheck(), 2 * 60 * 1000);
    setInterval(() => runCompletionCheck(), intervalMinutes * 60 * 1000);
}
