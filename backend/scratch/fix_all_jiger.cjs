const pg = require('pg');
require('dotenv').config();

async function run() {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    const jid = '77006915267@s.whatsapp.net';
    const lid = '9818748272801@lid';
    
    try {
        console.log("Updating realJid for ALL bots...");
        const res = await pool.query(
            'UPDATE "Contact" SET "realJid" = $1 WHERE "chatId" = $2 OR ("name" = $3 AND "chatId" LIKE \'%@lid\')',
            [jid, lid, 'Жигер']
        );
        console.log(`Updated ${res.rowCount} rows`);
        
        const check = await pool.query('SELECT * FROM "Contact" WHERE "name" = $1', ['Жигер']);
        console.log("Current state:", JSON.stringify(check.rows, null, 2));
    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await pool.end();
    }
}

run();
