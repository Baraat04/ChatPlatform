import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { prisma } from '../routes/bot-routes.js';
const db = prisma();

async function main() {
  const users = await db.user.findMany();
  for (const user of users) {
    if (user.messagesRemaining === 0) {
      await db.user.update({
        where: { id: user.id },
        data: { 
          messagesRemaining: 1000,
          messageTransactions: {
            create: {
              amount: 1000,
              type: 'bonus',
              description: 'System Update: Welcome 1000 Messages'
            }
          }
        }
      });
      console.log(`Updated user ${user.email} with 1000 messages.`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
