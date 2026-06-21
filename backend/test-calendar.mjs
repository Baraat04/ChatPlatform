import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const keyPath = path.resolve(__dirname, 'google-key.json');

// The exact URL user pasted
const RAW_URL = 'https://calendar.google.com/calendar/embed?src=e6f33abc018bbdb06fa6ba388ba44a0b01c9101ff687ae60f818c42eda7d06ec%40group.calendar.google.com&ctz=Asia%2FAlmaty';

function extractCalendarId(input) {
    const raw = input.trim();
    const srcMatch = raw.match(/[?&]src=([^&\s]+)/);
    if (srcMatch) return decodeURIComponent(srcMatch[1]);
    if (raw.includes('/ical/')) return decodeURIComponent(raw.split('/ical/')[1].split('/')[0]);
    return raw;
}

async function test() {
    const calendarId = extractCalendarId(RAW_URL);
    console.log('✅ Parsed Calendar ID:', calendarId);

    try {
        const auth = new google.auth.GoogleAuth({
            keyFile: keyPath,
            scopes: ['https://www.googleapis.com/auth/calendar'],
        });

        const calendar = google.calendar({ version: 'v3', auth });

        // Test 1: get calendar info
        console.log('\n--- Test 1: Get calendar metadata ---');
        try {
            const meta = await calendar.calendars.get({ calendarId });
            console.log('✅ Calendar name:', meta.data.summary);
            console.log('✅ Timezone:', meta.data.timeZone);
        } catch (e) {
            console.error('❌ calendars.get error:', e.message);
            console.error('   Status:', e.status);
            console.error('   Errors:', JSON.stringify(e.errors));
        }

        // Test 2: list events today
        console.log('\n--- Test 2: List events today ---');
        try {
            const today = new Date();
            const start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
            const end   = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
            const res = await calendar.events.list({
                calendarId,
                timeMin: start.toISOString(),
                timeMax: end.toISOString(),
                singleEvents: true,
            });
            console.log('✅ Events today:', res.data.items?.length ?? 0);
        } catch (e) {
            console.error('❌ events.list error:', e.message);
        }

        // Test 3: create a test event
        console.log('\n--- Test 3: Create test event (27 June 14:00) ---');
        try {
            const event = {
                summary: 'Даурен — Стрижка (тест)',
                description: 'Тестовая запись через API',
                start: { dateTime: '2026-06-27T14:00:00+05:00', timeZone: 'Asia/Almaty' },
                end:   { dateTime: '2026-06-27T15:00:00+05:00', timeZone: 'Asia/Almaty' },
            };
            const res = await calendar.events.insert({ calendarId, resource: event });
            console.log('✅ Event created!', res.data.htmlLink);
        } catch (e) {
            console.error('❌ events.insert error:', e.message);
            console.error('   Status:', e.status);
        }

    } catch (e) {
        console.error('❌ Auth error:', e.message);
    }
}

test();
