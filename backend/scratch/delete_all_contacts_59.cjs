const pg = require('pg');
require('dotenv').config();

async function run() {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    try {
        const botId = 59;
        
        // Delete contacts
        const contactRes = await pool.query('DELETE FROM "Contact" WHERE "botId" = $1', [botId]);
        console.log(`Deleted ${contactRes.rowCount} contacts for bot ${botId}`);
        
        // Delete messages
        const messageRes = await pool.query('DELETE FROM "Message" WHERE "botId" = $1', [botId]);
        console.log(`Deleted ${messageRes.rowCount} messages for bot ${botId}`);
    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await pool.end();
    }
}

run();
