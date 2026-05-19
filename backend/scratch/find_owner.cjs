const pg = require('pg');
require('dotenv').config();

async function run() {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    try {
        const botId = 59;
        const res = await pool.query(`
            SELECT u.email, u.password, b.id as bot_id 
            FROM "Bot" b 
            JOIN "User" u ON b.user_id = u.id 
            WHERE b.id = $1
        `, [botId]);
        if (res.rows.length > 0) {
            console.log("Account Info:", JSON.stringify(res.rows[0], null, 2));
        } else {
            console.log("No account found for bot", botId);
        }
    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await pool.end();
    }
}

run();
