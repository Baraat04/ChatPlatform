import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    try {
        const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
        const adapter = new PrismaPg(pool);
        const prisma = new PrismaClient({ adapter });
        
        const channels = await prisma.channel.findMany({ where: { platform: 'WHATSAPP' } });
        console.log("Channels:", channels);
        
        // Now verify if they are subscribed via Graph API
        for (const ch of channels) {
            if (!ch.whatsappWabaId) continue;
            console.log(`Checking WABA ${ch.whatsappWabaId}...`);
            const res = await fetch(`https://graph.facebook.com/v21.0/${ch.whatsappWabaId}/subscribed_apps`, {
                headers: { 'Authorization': `Bearer ${process.env.WA_SYSTEM_USER_TOKEN}` }
            });
            const data = await res.json();
            console.log(`Subscriptions for ${ch.whatsappWabaId}:`, JSON.stringify(data, null, 2));
        }
    } catch(err) {
        console.error("FATAL ERROR:", err);
    }
}
main().finally(() => process.exit(0));
