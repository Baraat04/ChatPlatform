import { prisma as getPrisma } from '../routes/bot-routes.js'
import { generateGeminiResponse } from './GeminiService.js'

const generateAnalyticsPrompt = (botGoal) => `Ты - опытный РОП (Руководитель отдела продаж) и аналитик качества обслуживания.
Твоя задача - проанализировать историю переписки клиента с ИИ-ассистентом или менеджером и вернуть строгий JSON-ответ без markdown (без \\\`\\\`\\\`json).

ПРАВИЛА И ЭТАПЫ ВОРОНКИ:
Выбери ОДИН из следующих этапов воронки (funnelStage):
- "Лид" (только поздоровался, диалог только начат)
- "Квалификация" (выяснение потребностей)
- "Презентация" (рассказ о товаре/услуге/ценах)
- "Отработка возражений" (клиент сомневается, дорого, нужно подумать)
- "Ожидание оплаты" (клиенту скинули реквизиты или ссылку на оплату)
- "Успешно" (КРИТИЧЕСКИ ВАЖНО: ставь этот этап ТОЛЬКО ЕСЛИ ДОСТИГНУТА СЛЕДУЮЩАЯ ЦЕЛЬ БОТА: "\${botGoal || 'Клиент сделал покупку или запись'}". Если цель не достигнута, выбери другой этап)
- "Отказ" (клиент явно сказал "нет" или ушел к конкурентам)
- "Молчит" (клиент перестал отвечать после презентации или цены)

Оцени качество диалога (score) от 0 до 100:
- Был ли призыв к действию (CTA)?
- Насколько вежливо и полно ответил бот?

Если этап "Отказ" или "Молчит", укажи КРАТКУЮ причину в dropOffReason (например, "Испугала цена", "Бот не ответил на вопрос", "Ушел подумать"). Если все хорошо, оставь dropOffReason пустым (null).

Сгенерируй короткий совет для владельца бизнеса в поле insights (например, "Предложите скидку 10%, так как клиент сомневается из-за цены").

Также определи короткий статус чата (status) для интерфейса (например: "Все", "Нужен ответ", "Ждет оплаты", "Думает", "Успех", "Отказ"). "Нужен ответ" ставь только если последнее сообщение от пользователя и требует реакции.

ФОРМАТ ОТВЕТА (строгий JSON):
{
  "funnelStage": "Презентация",
  "score": 85,
  "dropOffReason": null,
  "insights": "Клиент интересуется доставкой, стоит добавить информацию о доставке в базу знаний.",
  "status": "Думает"
}
`;

export async function processAnalyticsJobs() {
    const prisma = getPrisma();
    console.log('[Analytics Worker] Checking for pending jobs...');
    
    try {
        const jobs = await prisma.backgroundJob.findMany({
            where: { status: 'PENDING', type: 'ANALYZE_CHAT' },
            take: 10
        });

        if (jobs.length === 0) {
            console.log('[Analytics Worker] No pending jobs.');
            return { processed: 0 };
        }

        console.log(`[Analytics Worker] Found ${jobs.length} jobs. Processing...`);

        // Mark as processing
        const jobIds = jobs.map(j => j.id);
        await prisma.backgroundJob.updateMany({
            where: { id: { in: jobIds } },
            data: { status: 'PROCESSING' }
        });

        let processedCount = 0;

        for (const job of jobs) {
            try {
                const payload = JSON.parse(job.payload);
                const botId = job.botId;
                const chatId = payload.chatId;

                // 1. Fetch chat history
                const messages = await prisma.message.findMany({
                    where: { botId, chatId },
                    orderBy: { createdAt: 'asc' }
                });

                if (messages.length === 0) {
                    await prisma.backgroundJob.update({
                        where: { id: job.id },
                        data: { status: 'COMPLETED', error: 'No messages found' }
                    });
                    continue;
                }

                const history = messages.map(msg => ({
                    role: msg.sender === 'bot' ? 'assistant' : 'user',
                    content: msg.text || '[Медиафайл]'
                }));

                const historyText = history.map(h => `${h.role === 'user' ? 'КЛИЕНТ' : 'БОТ'}: ${h.content}`).join('\n');

                const botInfo = await prisma.bot.findUnique({ where: { id: botId } });
                const prompt = generateAnalyticsPrompt(botInfo?.system_prompt ? botInfo.system_prompt.substring(0, 500) : null);

                // 2. Call Gemini
                const result = await generateGeminiResponse(
                    "Проанализируй этот диалог:\n\n" + historyText,
                    [], // no sliding history needed, we pass it all in the prompt
                    prompt,
                    "" // no rag
                );

                let parsed;
                try {
                    let jsonText = result.text.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
                    parsed = JSON.parse(jsonText);
                } catch (e) {
                    throw new Error("Failed to parse Gemini JSON: " + result.text);
                }

                // 3. Save to ChatAnalytics
                await prisma.chatAnalytics.upsert({
                    where: { botId_chatId: { botId, chatId } },
                    update: {
                        funnelStage: parsed.funnelStage || 'Лид',
                        score: parsed.score || 0,
                        dropOffReason: parsed.dropOffReason || null,
                        insights: parsed.insights || null,
                        lastAnalyzed: new Date()
                    },
                    create: {
                        botId,
                        chatId,
                        funnelStage: parsed.funnelStage || 'Лид',
                        score: parsed.score || 0,
                        dropOffReason: parsed.dropOffReason || null,
                        insights: parsed.insights || null
                    }
                });

                // 4. Update Contact status
                if (parsed.status) {
                    await prisma.contact.updateMany({
                        where: { botId, chatId },
                        data: { status: parsed.status }
                    });
                }

                // 5. Mark COMPLETED
                await prisma.backgroundJob.update({
                    where: { id: job.id },
                    data: { status: 'COMPLETED' }
                });

                processedCount++;
                console.log(`[Analytics Worker] Job ${job.id} completed. Funnel: ${parsed.funnelStage}, Status: ${parsed.status}`);

            } catch (err) {
                console.error(`[Analytics Worker] Error on job ${job.id}:`, err);
                await prisma.backgroundJob.update({
                    where: { id: job.id },
                    data: { status: 'FAILED', error: err.message }
                });
            }
        }
        
        return { processed: processedCount };

    } catch (err) {
        console.error('[Analytics Worker] Fatal error:', err);
        return { processed: 0, error: err.message };
    }
}
