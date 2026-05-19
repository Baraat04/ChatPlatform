const pg = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function run() {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    try {
        const email = 'zhigazh2018@gmail.com';
        const newPassword = 'password123';
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        
        const res = await pool.query(`
            UPDATE "User"
            SET password = $1
            WHERE email = $2
            RETURNING id, name, email
        `, [hashedPassword, email]);
        
        if (res.rows.length > 0) {
            console.log("Successfully updated password!");
            console.log("User Info:", JSON.stringify(res.rows[0], null, 2));
            console.log("New Password:", newPassword);
        } else {
            console.log("User not found:", email);
        }
    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await pool.end();
    }
}

run();
