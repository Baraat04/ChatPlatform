const pg = require('pg');
require('dotenv').config();

async function run() {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    const lid = '9818748272801@lid';
    const jid = '77006915267@s.whatsapp.net';
    const botId = 55;

    try {
        console.log(`Merging ${lid} to ${jid} and saving mapping...`);
        
        // Save mapping in the LID contact
        await pool.query(
            'UPDATE "Contact" SET "realJid" = $1 WHERE "chatId" = $2 AND "botId" = $3',
            [jid, lid, botId]
        );

        // Update messages
        await pool.query(
            'UPDATE "Message" SET "chatId" = $1 WHERE "chatId" = $2 AND "botId" = $3',
            [jid, lid, botId]
        );

        console.log("Done!");
    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await pool.end();
    }
}

run();
