import { generateGeminiResponse } from './src/services/GeminiService.js';

async function test() {
    try {
        console.log("Calling Gemini API with tools...");
        const integrationConfig = {
            googleSheetUrl: "yes",
            googleSheetColumns: "Name, Phone",
            bitrixWebhookUrl: "yes",
            googleCalendarId: "yes"
        };
        const result = await generateGeminiResponse("Здравствуйте", [], "You are a bot", "", null, null, integrationConfig);
        console.log("Success:", result);
    } catch (e) {
        console.error("Test Failed. Error details:");
        console.error(e.message);
        if (e.response) console.error(JSON.stringify(e.response, null, 2));
    }
}

test();
