// The bot's configuration as editable blocks.
//
// Background: `Bot.system_prompt` and `Bot.data_prompt` used to be edited by appending —
// every correction added another "=== IMPORTANT CORRECTION ===" section, every uploaded PDF
// added another "--- ДАННЫЕ ИЗ PDF ---" block, and nothing could ever be removed. After a few
// weeks a bot carried a dozen half-contradictory instructions and answered unpredictably.
//
// Now the user edits discrete blocks and those two columns are *generated* from them. The AI
// pipeline is unchanged — it still reads system_prompt/data_prompt — so nothing downstream
// had to be touched. Rebuilding from scratch is what makes deletion actually take effect.

export const SECTIONS = ['identity', 'style', 'knowledge', 'limits'];

// Fixed assembly order. The model reads top-down, so identity comes first (who is speaking),
// then how to speak, then the hard limits last — closest to the user's message, where
// instructions carry the most weight.
const SYSTEM_SECTIONS = [
    { key: 'identity', heading: 'КТО ВЫ' },
    { key: 'style', heading: 'КАК ОТВЕЧАТЬ' },
    { key: 'limits', heading: 'ЧЕГО ДЕЛАТЬ НЕЛЬЗЯ' },
];

const GROUNDING_RULE = [
    'ГЛАВНОЕ ПРАВИЛО: отвечай только на основе информации из раздела «Что знает бот».',
    'Если нужных данных там нет — так и скажи и предложи уточнить у менеджера.',
    'Никогда не выдумывай цены, сроки, адреса, наличие товара и условия доставки.',
].join('\n');

/**
 * Rebuild Bot.system_prompt and Bot.data_prompt from the bot's blocks.
 *
 * Call after every create/update/delete/reorder. Returns the composed strings so a caller can
 * show the result without a second read.
 */
export async function composeBotPrompt(prisma, botId) {
    const blocks = await prisma.brainBlock.findMany({
        where: { botId, isActive: true },
        orderBy: [{ section: 'asc' }, { order: 'asc' }, { id: 'asc' }],
    });

    const bySection = (section) => blocks.filter(b => b.section === section);

    const systemParts = [];
    for (const { key, heading } of SYSTEM_SECTIONS) {
        const items = bySection(key);
        if (items.length === 0) continue;

        const body = items
            .map(b => {
                const text = (b.content || '').trim();
                if (!text) return null;
                // Identity reads as prose; style and limits read as a checklist, which the
                // model follows more reliably than the same rules run together as a paragraph.
                return key === 'identity' ? text : `- ${text}`;
            })
            .filter(Boolean)
            .join('\n');

        if (body) systemParts.push(`## ${heading}\n${body}`);
    }

    systemParts.push(GROUNDING_RULE);

    const knowledge = bySection('knowledge')
        .map(b => {
            const title = (b.title || '').trim();
            const text = (b.content || '').trim();
            if (!text) return null;
            // The file link has to travel with the text: without it the model knows the
            // contents of a price list but cannot send the file when a customer asks for it.
            const link = b.sourceUrl
                ? `\nССЫЛКА НА ФАЙЛ ДЛЯ ОТПРАВКИ КЛИЕНТУ: ${b.sourceUrl}\n(Если клиент просит этот файл, используй инструмент send_file_to_client с этой ссылкой)`
                : '';
            return title ? `### ${title}${link}\n${text}` : `${text}${link}`;
        })
        .filter(Boolean)
        .join('\n\n');

    const system_prompt = systemParts.join('\n\n');
    const data_prompt = knowledge;

    await prisma.bot.update({
        where: { id: botId },
        data: { system_prompt, data_prompt },
    });

    return { system_prompt, data_prompt };
}

/**
 * One-time migration for a bot that has prompts but no blocks yet.
 *
 * Existing prompts are free text with no reliable structure, so this does not try to be clever:
 * the whole system_prompt becomes one editable "identity" block and the whole data_prompt one
 * "knowledge" block — except that PDF sections, which do have a stable marker, are split out so
 * each uploaded file becomes its own deletable card. Nothing is lost and nothing is guessed.
 */
export async function seedBrainFromPrompts(prisma, bot) {
    const existing = await prisma.brainBlock.count({ where: { botId: bot.id } });
    if (existing > 0) return false;

    const blocks = [];
    const system = (bot.system_prompt || '').trim();
    const data = (bot.data_prompt || '').trim();

    if (!system && !data) return false;

    if (system) {
        blocks.push({
            botId: bot.id,
            section: 'identity',
            title: 'Описание бота',
            content: system,
            source: 'migrated',
            order: 0,
        });
    }

    if (data) {
        // "--- ДАННЫЕ ИЗ PDF (filename) ---" is the only marker the old append path wrote
        // consistently, so it is the only split that can be done without guessing.
        const parts = data.split(/\n*---\s*ДАННЫЕ ИЗ PDF\s*\(([^)]*)\)\s*---\n*/);
        const intro = (parts[0] || '').trim();
        if (intro) {
            blocks.push({
                botId: bot.id,
                section: 'knowledge',
                title: 'Данные о компании',
                content: intro,
                source: 'migrated',
                order: 0,
            });
        }
        for (let i = 1; i < parts.length; i += 2) {
            const filename = (parts[i] || 'Файл').trim();
            const body = (parts[i + 1] || '').trim();
            if (!body) continue;
            blocks.push({
                botId: bot.id,
                section: 'knowledge',
                title: filename,
                content: body,
                source: 'pdf',
                order: Math.ceil(i / 2),
            });
        }
    }

    if (blocks.length === 0) return false;

    await prisma.brainBlock.createMany({ data: blocks });
    return true;
}
