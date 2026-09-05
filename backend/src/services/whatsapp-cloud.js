// Uses Node 20's global fetch/FormData/Blob — node-fetch is not a declared dependency.

// Overridable so the Graph version can be raised without a code change. Keep this in step
// with the version selected for each webhook topic in the App Dashboard — Meta sends the
// payload shape of the *subscription's* version, not of the version we call.
const GRAPH_API_VERSION = process.env.GRAPH_API_VERSION || 'v21.0';

// Coexistence endpoints (/smb_app_data) postdate v21.0, so calling them on the version
// above would fail as an unknown edge. They get their own, newer version rather than
// raising GRAPH_API_VERSION globally — message sending works on v21.0 today and there is
// no test suite to catch a regression from moving it.
const SMB_GRAPH_API_VERSION = process.env.SMB_GRAPH_API_VERSION || 'v23.0';

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

    if (!wabaId) {
        throw new Error('Could not extract waba_id from the token scopes.');
    }

    // Fetch the actual Phone Number ID from the WABA
    const phoneRes = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${wabaId}/phone_numbers`, {
        headers: { 'Authorization': `Bearer ${process.env.WA_SYSTEM_USER_TOKEN}` }
    });
    const phoneData = await phoneRes.json();

    if (!phoneData.data || phoneData.data.length === 0) {
        throw new Error('No phone numbers found in the connected WABA.');
    }

    const phoneNumberId = phoneData.data[0].id; // Use the first connected phone number

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

/**
 * Turn a stored chatId into the bare wa_id the Cloud API expects.
 * Handles legacy Baileys JIDs (`7999...@s.whatsapp.net`, `...@c.us`) and plain numbers.
 */
export function toWaId(chatId) {
    if (!chatId) return '';
    return String(chatId).split('@')[0].replace(/\D/g, '');
}

/**
 * Graph errors carry the actionable detail in error.error_data.details.
 * 131047 = outside the 24h customer service window (template required).
 */
function graphError(prefix, error) {
    const detail = error?.error_data?.details || error?.message || 'Unknown Graph API error';
    const err = new Error(`${prefix}: ${detail}`);
    err.code = error?.code;
    err.subcode = error?.error_subcode;
    return err;
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
            to: toWaId(to),
            type: 'text',
            text: { preview_url: false, body: text }
        })
    });

    const data = await response.json();
    if (data.error) {
        console.error('Error sending WhatsApp Cloud message:', data.error);
        throw graphError('Failed to send message', data.error);
    }

    return data;
}

/**
 * Step 1 of outbound media: upload the bytes and get a reusable media id.
 * The Cloud API will not accept raw bytes on /messages.
 */
export async function uploadWhatsAppMedia(phoneNumberId, buffer, mimeType, filename, accessToken) {
    const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/media`;

    // Graph rejects parameterised mime types on upload (e.g. "audio/ogg; codecs=opus").
    const cleanMime = String(mimeType || 'application/octet-stream').split(';')[0].trim();

    const form = new FormData();
    form.append('messaging_product', 'whatsapp');
    form.append('type', cleanMime);
    form.append('file', new Blob([buffer], { type: cleanMime }), filename || 'upload');

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
        body: form
    });

    const data = await response.json();
    if (data.error) {
        console.error('[WhatsApp Cloud] Error uploading media:', data.error);
        throw graphError('Failed to upload media', data.error);
    }
    if (!data.id) throw new Error('Media upload returned no id');

    return data.id;
}

/**
 * Step 2 of outbound media. `type` is one of image | audio | video | document | sticker.
 * Note: WhatsApp ignores captions on audio, and requires `filename` for documents
 * so the recipient sees a real name instead of the media id.
 */
export async function sendWhatsAppCloudMedia(phoneNumberId, to, { type, mediaId, caption, filename }, accessToken) {
    const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`;

    const mediaObject = { id: mediaId };
    if (caption && (type === 'image' || type === 'video' || type === 'document')) {
        mediaObject.caption = caption;
    }
    if (type === 'document' && filename) {
        mediaObject.filename = filename;
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: toWaId(to),
            type,
            [type]: mediaObject
        })
    });

    const data = await response.json();
    if (data.error) {
        console.error('[WhatsApp Cloud] Error sending media message:', data.error);
        throw graphError('Failed to send media', data.error);
    }

    return data;
}

/**
 * Inbound media is also two-step: resolve the media id to a short-lived lookaside
 * URL, then fetch that URL — which still requires the Authorization header.
 */
export async function downloadWhatsAppMedia(mediaId, accessToken) {
    const metaRes = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${mediaId}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const meta = await metaRes.json();

    if (meta.error) {
        console.error('[WhatsApp Cloud] Error resolving media id:', meta.error);
        throw graphError('Failed to resolve media', meta.error);
    }
    if (!meta.url) throw new Error(`Media ${mediaId} has no download URL`);

    const binRes = await fetch(meta.url, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    if (!binRes.ok) {
        throw new Error(`Failed to download media ${mediaId}: HTTP ${binRes.status}`);
    }

    const buffer = Buffer.from(await binRes.arrayBuffer());
    return { buffer, mimeType: meta.mime_type || 'application/octet-stream', sha256: meta.sha256 };
}

/**
 * Read a number's messaging limit and quality rating from Meta.
 *
 * The tier field is `whatsapp_business_manager_messaging_limit` (values like "TIER_250") —
 * note it is not `messaging_limit_tier`, which does not exist and returns an error. Quality is
 * GREEN / YELLOW / RED / NA / UNKNOWN.
 *
 * Requested on a newer Graph version than GRAPH_API_VERSION: these fields postdate v21.0.
 */
export async function getPhoneNumberStatus(phoneNumberId, accessToken) {
    const fields = 'whatsapp_business_manager_messaging_limit,quality_rating,display_phone_number,verified_name,platform_type,is_on_biz_app,code_verification_status';
    const url = `https://graph.facebook.com/${SMB_GRAPH_API_VERSION}/${phoneNumberId}?fields=${fields}`;

    const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${accessToken || process.env.WA_SYSTEM_USER_TOKEN}` }
    });
    const data = await response.json();

    if (data.error) {
        console.error(`[WhatsApp Cloud] Error reading status for ${phoneNumberId}:`, data.error);
        throw graphError('Failed to read phone number status', data.error);
    }
    return data;
}

/** "TIER_250" → 250. Returns null for UNLIMITED or anything unrecognised. */
export function tierToNumber(tier) {
    if (!tier || typeof tier !== 'string') return null;
    const match = tier.match(/(\d+)/);
    return match ? Number(match[1]) : null;
}

/**
 * Detach our app from a customer's WABA. Without this, deleting the channel only removes
 * our own row — Meta keeps delivering that WABA's messages to our webhook, and the number
 * stays attached to the app, so reconnecting it later (or another tenant claiming it)
 * behaves unpredictably. Best-effort: the row must be deletable even when Meta refuses.
 */
export async function unsubscribeWabaFromWebhook(wabaId, accessToken) {
    const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${wabaId}/subscribed_apps`;

    const response = await fetch(url, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken || process.env.WA_SYSTEM_USER_TOKEN}` }
    });

    const data = await response.json();
    if (data.error) {
        console.error(`[WhatsApp Cloud] Error unsubscribing WABA ${wabaId}:`, data.error);
        throw graphError('Failed to unsubscribe WABA', data.error);
    }

    console.log(`[WhatsApp Cloud] ✅ Unsubscribed WABA ${wabaId} from webhook.`);
    return data;
}

/**
 * Coexistence only: ask Meta to push the business's existing WhatsApp Business app data
 * into our webhook. `sync_type` is 'history' (past conversations) or 'smb_app_state_sync'
 * (contacts). Meta allows each of these **once per onboarding** — there is no retry, so the
 * returned request_id is logged for support if the follow-up webhooks never arrive.
 *
 * Fails soft: a business that declined history sharing, or a number that isn't a
 * Coexistence number, must not break an otherwise successful connect.
 */
export async function syncSmbAppData(phoneNumberId, syncType, accessToken) {
    const url = `https://graph.facebook.com/${SMB_GRAPH_API_VERSION}/${phoneNumberId}/smb_app_data`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ messaging_product: 'whatsapp', sync_type: syncType })
    });

    const data = await response.json();
    if (data.error) {
        console.error(`[WhatsApp Cloud] smb_app_data (${syncType}) failed:`, data.error);
        throw graphError(`Failed to start ${syncType} sync`, data.error);
    }

    console.log(`[WhatsApp Cloud] ${syncType} sync requested for ${phoneNumberId}, request_id=${data.request_id}`);
    return data;
}

/** Map a WhatsApp inbound message type to our Message.mediaType vocabulary. */
export function waTypeToMediaType(waType) {
    switch (waType) {
        case 'image':
        case 'sticker':
            return 'image';
        case 'audio':
        case 'voice':
            return 'audio';
        case 'video':
            return 'video';
        case 'document':
            return 'document';
        default:
            return null;
    }
}
