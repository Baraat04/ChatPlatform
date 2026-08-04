// Uses Node 20's global fetch — node-fetch is not a declared dependency.
import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const keyPath = path.resolve(__dirname, '../../google-key.json');

let authClient = null;

async function getGoogleAuth() {
    if (!authClient) {
        authClient = new google.auth.GoogleAuth({
            keyFile: keyPath,
            scopes: [
                'https://www.googleapis.com/auth/spreadsheets',
                'https://www.googleapis.com/auth/calendar'
            ],
        });
    }
    return authClient;
}

/**
 * Extract actual Calendar ID from ANY Google Calendar URL format:
 *   - /embed?src=EMAIL%40group.calendar.google.com&ctz=...
 *   - /ical/EMAIL%40.../basic.ics
 *   - plain email like xxx@group.calendar.google.com
 *   - "primary"
 */
function extractCalendarId(input) {
    if (!input || !input.trim()) return null;
    const raw = input.trim();

    // /embed?src=... or any URL with ?src= or &src=
    const srcMatch = raw.match(/[?&]src=([^&\s]+)/);
    if (srcMatch) {
        return decodeURIComponent(srcMatch[1]);
    }

    // /ical/EMAIL%40.../basic.ics
    if (raw.includes('/ical/')) {
        return decodeURIComponent(raw.split('/ical/')[1].split('/')[0]);
    }

    // Any other URL — try to find an email-like calendar ID inside
    if (raw.startsWith('http')) {
        const emailMatch = raw.match(/([a-zA-Z0-9._%-]+(?:%40|@)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
        if (emailMatch) return decodeURIComponent(emailMatch[1]);
        return null;
    }

    // Assume it's already a plain calendar ID (email or "primary")
    return raw;
}

export async function executeIntegrationFunction(name, args, config) {
    console.log(`[IntegrationExecutor] Executing ${name} with args:`, JSON.stringify(args));

    // ── CHECK CALENDAR AVAILABILITY ──────────────────────────────────────────
    if (name === 'check_calendar_availability' && config.googleCalendarId) {
        try {
            const calendarId = extractCalendarId(config.googleCalendarId);
            if (!calendarId) return { success: false, error: 'Could not parse Calendar ID from the provided URL.' };
            console.log(`[Calendar] Resolved Calendar ID: ${calendarId}`);

            const auth = await getGoogleAuth();
            const calendar = google.calendar({ version: 'v3', auth });

            // Check the full day in UTC+5 (Asia/Almaty)
            const startOfDay = new Date(`${args.date}T00:00:00+05:00`);
            const endOfDay   = new Date(`${args.date}T23:59:59+05:00`);

            const res = await calendar.events.list({
                calendarId,
                timeMin: startOfDay.toISOString(),
                timeMax: endOfDay.toISOString(),
                singleEvents: true,
                orderBy: 'startTime',
            });

            const events = res.data.items || [];
            const busySlots = events.map(e => ({
                start: e.start.dateTime || e.start.date,
                end:   e.end.dateTime   || e.end.date,
                title: e.summary || 'Занято'
            }));

            return {
                success: true,
                date: args.date,
                busySlots,
                message: busySlots.length === 0
                    ? 'Весь день свободен'
                    : `Занятые слоты: ${busySlots.map(s => s.start.slice(11,16) + '–' + s.end.slice(11,16)).join(', ')}`
            };
        } catch (e) {
            console.error('[Calendar] check error:', e.message);
            return { success: false, error: e.message };
        }
    }

    // ── CREATE CALENDAR EVENT ────────────────────────────────────────────────
    if (name === 'create_calendar_event' && config.googleCalendarId) {
        try {
            const calendarId = extractCalendarId(config.googleCalendarId);
            if (!calendarId) return { success: false, error: 'Could not parse Calendar ID from the provided URL.' };
            console.log(`[Calendar] Creating event in calendar: ${calendarId}`);

            const auth = await getGoogleAuth();
            const calendar = google.calendar({ version: 'v3', auth });

            const duration = args.durationMinutes || 60;
            const TIMEZONE = 'Asia/Almaty'; // UTC+5

            // Normalize time to HH:MM (handle "14:00" and "14:00:00")
            const timePart = (args.time || '09:00').replace(/:\d{2}$/, (m, offset, str) => {
                // if string is like "14:00:00" remove last :ss, else keep
                return str.split(':').length > 2 ? '' : m;
            }).replace(/^(\d{2}:\d{2}):\d{2}$/, '$1');

            // Build RFC3339 datetime with explicit +05:00 offset
            const startStr = `${args.date}T${timePart}:00+05:00`;
            const startMs  = new Date(startStr).getTime();
            const endMs    = startMs + duration * 60000;

            // Format a Date back to RFC3339 +05:00 string
            const toLocal = (ms) => {
                const d = new Date(ms + 5 * 3600000); // shift to UTC+5
                const p = n => String(n).padStart(2, '0');
                return `${d.getUTCFullYear()}-${p(d.getUTCMonth()+1)}-${p(d.getUTCDate())}` +
                       `T${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:00+05:00`;
            };

            const event = {
                summary:     args.title       || 'Запись',
                description: args.description || '',
                start: { dateTime: toLocal(startMs), timeZone: TIMEZONE },
                end:   { dateTime: toLocal(endMs),   timeZone: TIMEZONE },
            };

            console.log(`[Calendar] Event payload: ${JSON.stringify(event)}`);

            const res = await calendar.events.insert({ calendarId, resource: event });
            console.log(`[Calendar] Event created: ${res.data.htmlLink}`);
            return { success: true, eventLink: res.data.htmlLink, eventId: res.data.id };
        } catch (e) {
            console.error('[Calendar] create error:', e.message);
            return { success: false, error: e.message };
        }
    }

    // ── CREATE CRM LEAD (BITRIX) ─────────────────────────────────────────────
    if (name === 'create_crm_lead' && config.bitrixWebhookUrl) {
        try {
            let bitrixUrl = config.bitrixWebhookUrl;
            if (bitrixUrl.includes('crm.lead.add')) {
                bitrixUrl = bitrixUrl.split('crm.lead.add')[0];
            }
            if (!bitrixUrl.endsWith('/')) bitrixUrl += '/';

            const res = await fetch(`${bitrixUrl}crm.lead.add.json`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fields: {
                        TITLE:    `Лид из чат-бота: ${args.name || 'Клиент'}`,
                        NAME:     args.name  || 'Клиент',
                        PHONE:    [{ VALUE: args.phone, VALUE_TYPE: 'WORK' }],
                        COMMENTS: args.comments || 'Создано ИИ ботом.'
                    }
                })
            });
            const data = await res.json();
            if (data.error) {
                console.error('[Bitrix] API Error:', JSON.stringify(data));
                return { success: false, error: data.error_description || data.error };
            }
            console.log('[Bitrix] Lead created. ID:', data.result);
            return { success: true, leadId: data.result };
        } catch (e) {
            console.error('[Bitrix] Request error:', e.message);
            return { success: false, error: e.message };
        }
    }

    // ── SAVE TO GOOGLE SHEETS ────────────────────────────────────────────────
    if (name === 'save_to_google_sheets' && config.googleSheetUrl) {
        try {
            const { appendToSheet } = await import('./GoogleSheetsService.js');
            let parsedData = args.data;
            if (typeof parsedData === 'string') {
                try { parsedData = JSON.parse(parsedData); } catch(e) {}
            }
            await appendToSheet(config.googleSheetUrl, config.googleSheetColumns, parsedData);
            return { success: true, message: 'Данные сохранены' };
        } catch (e) {
            console.error('[Sheets] error:', e);
            return { success: false, error: e.message };
        }
    }

    // ── CALL MANAGER ─────────────────────────────────────────────────────────
    if (name === 'call_manager') {
        return { success: true, pauseChat: true, message: 'Менеджер вызван. Переписка поставлена на паузу.' };
    }

    return { success: false, error: 'Function not recognized or integration not configured.' };
}
