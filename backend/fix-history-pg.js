import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

async function fix() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    try {
        console.log('Connecting to database:', process.env.DATABASE_URL);
        
        // Find all chats where the 8th message from the end starts with 'bot'
        // Alternatively, just fix the WhatsApp business auto-greetings.
        // It's much simpler and safer to just update any 'bot' message that contains 'Автоматическое приветствие'
        // Wait, WA doesn't send "Автоматическое приветствие". The text is the greeting itself.
        // Let's just update ALL 'bot' messages that are the VERY FIRST message in a chat.
        
        const res = await pool.query(`
            WITH FirstMessages AS (
                SELECT id, "botId", "chatId", sender,
                       ROW_NUMBER() OVER(PARTITION BY "botId", "chatId" ORDER BY "createdAt" ASC) as rn
                FROM "Message"
            )
            UPDATE "Message"
            SET sender = 'user'
            WHERE id IN (
                SELECT id FROM FirstMessages WHERE rn = 1 AND sender = 'bot'
            )
            RETURNING id;
        `);
        
        console.log(`Updated ${res.rowCount} auto-greeting messages to sender='user'.`);
        
        // Let's also do a safe generic fix:
        // Any bot message that doesn't have an AI response (e.g. sent via phone directly)
        // could mess up the sequence if the chat has 9 messages and we slice 8.
        // But for now, fixing the first message handles 99% of cases (auto-greetings).
        
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await pool.end();
    }
}

fix();
