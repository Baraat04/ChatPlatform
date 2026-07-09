import { generateGeminiResponse } from './src/services/GeminiService.js';

async function test() {
    try {
        console.log("Calling Gemini API...");
        const result = await generateGeminiResponse("Здравствуйте", [], "You are a bot");
        console.log("Success:", result);
    } catch (e) {
        console.error("Test Failed. Error details:");
        console.error(e.message);
        if (e.response) console.error(JSON.stringify(e.response, null, 2));
    }
}

test();
