import pg from 'pg';
const { Pool } = pg;

async function run() {
    const url = process.env.DATABASE_URL || 'postgresql://postgres:postgres@db:5432/ai-consultant?schema=public';
    const pool = new Pool({ connectionString: url });
    try {
        const res = await pool.query('SELECT id, slug, "googleCalendarId" FROM "Bot";');
        console.log(JSON.stringify(res.rows, null, 2));
    } finally {
        await pool.end();
    }
}
run().catch(console.error);
