const pg = require('pg');
require('dotenv').config();

async function run() {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    try {
        const res = await pool.query('SELECT * FROM "Contact"');
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await pool.end();
    }
}

run();
