import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });
import { prisma } from '../routes/bot-routes.js';
const db = prisma();

async function main() {
  const bots = await db.bot.findMany({ where: { platform: 'WHATSAPP', isActive: true } });
  console.log(`Currently active WhatsApp bots: ${bots.length}`);
  bots.forEach(b => console.log(`- Bot ${b.id}: user=${b.user_id}, slug=${b.slug}, active=${b.isActive}`));
}

main().finally(() => process.exit(0));
