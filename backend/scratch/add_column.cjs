const pg = require('pg');
require('dotenv').config();

async function run() {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    try {
        console.log("Adding realJid column to Contact table...");
        await pool.query('ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "realJid" TEXT');
        console.log("Success!");
    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await pool.end();
    }
}

run();
