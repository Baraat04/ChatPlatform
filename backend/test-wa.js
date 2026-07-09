import { generateGeminiResponse } from './src/services/GeminiService.js';

async function test() {
    try {
        const history = [
            {
                role: 'bot',
                text: 'Привет 🙌 Вы написали по курсу «Про деньги» за 2990 тг.\n\nЭто практический курс, где вы:\n— поймёте, почему деньги не держатся\n— увидите свой финансовый сценарий\n— получите пошаговый план выхода из потолка\n\nДоступ открывается сразу после оплаты.'
            }
        ];
        
        const historyMapped = history.map(msg => ({
            role: msg.role === 'bot' ? 'model' : 'user',
            parts: [{ text: msg.text }]
        }));

        console.log("Calling Gemini API with simulated history...");
        const result = await generateGeminiResponse("Здравствуйте", historyMapped, "You are a sales bot");
        console.log("Success:", result);
    } catch (e) {
        console.error("Test Failed. Error details:");
        console.error(e.message);
        if (e.response) console.error(JSON.stringify(e.response, null, 2));
        console.error(e.stack);
    }
}

test();
