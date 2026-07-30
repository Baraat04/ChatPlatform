import fetch from 'node-fetch';

const GRAPH_API_VERSION = 'v21.0';

export async function exchangeCodeForToken(code) {
    const appId = process.env.WA_APP_ID;
    const appSecret = process.env.WA_APP_SECRET;
    
    // As per Meta documentation, Tech Providers use a specific endpoint or graph.facebook.com for OAuth
    // But since this is Embedded Signup, the token we exchange might just be the system user token,
    // or we actually get an access token for the business. Let's use the standard oauth exchange:
    const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&code=${code}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.error) {
        throw new Error(`Failed to exchange code: ${data.error.message}`);
    }
    
    return data.access_token;
}

export async function getWabaAndPhone(accessToken) {
    // In Embedded Signup, we often use the debug_token endpoint or fetch the waba directly.
    // Or we fetch me/businesses and me/phone_numbers.
    // To get the shared WABA ID and Phone Number ID, we fetch from the user's debug token or business manager.
    // Alternatively, Meta says for Tech Providers, the `code` is exchanged for a token, then you can call:
    const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/debug_token?input_token=${accessToken}&access_token=${process.env.WA_SYSTEM_USER_TOKEN}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.error) {
        throw new Error(`Failed to debug token: ${data.error.message}`);
    }
    
    const wabaId = data.data.granular_scopes.find(s => s.scope === 'whatsapp_business_management')?.target_ids[0];
    const phoneNumberId = data.data.granular_scopes.find(s => s.scope === 'whatsapp_business_messaging')?.target_ids[0];
    
    if (!wabaId || !phoneNumberId) {
        throw new Error('Could not extract waba_id or phone_number_id from the token scopes.');
    }
    
    return { wabaId, phoneNumberId };
}

export async function registerPhone(phoneNumberId) {
    const accessToken = process.env.WA_SYSTEM_USER_TOKEN;
    const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/register`;
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
            messaging_product: 'whatsapp',
            pin: '123456'
        })
    });
    
    const data = await response.json();
    if (data.error) {
        console.error('Error registering phone:', data.error);
        throw new Error(`Failed to register phone: ${data.error.message}`);
    }
    
    return data;
}

export async function subscribeWabaToWebhook(wabaId) {
    const accessToken = process.env.WA_SYSTEM_USER_TOKEN;
    const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${wabaId}/subscribed_apps`;
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        }
    });
    
    const data = await response.json();
    if (data.error) {
        console.error(`[WhatsApp Cloud] ❌ Error subscribing WABA ${wabaId} to webhook:`, data.error);
        throw new Error(`Failed to subscribe WABA: ${data.error.message}`);
    }
    
    console.log(`[WhatsApp Cloud] ✅ Successfully subscribed WABA ${wabaId} to webhook. Response:`, data);
    return data;
}

export async function sendWhatsAppCloudMessage(phoneNumberId, to, text, accessToken) {
    const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`;
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: to,
            type: 'text',
            text: { preview_url: false, body: text }
        })
    });
    
    const data = await response.json();
    if (data.error) {
        console.error('Error sending WhatsApp Cloud message:', data.error);
        throw new Error(`Failed to send message: ${data.error.message}`);
    }
    
    return data;
}
