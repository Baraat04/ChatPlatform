import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { prisma } from '../routes/bot-routes.js';
const db = prisma();

async function main() {
  console.log('Cleaning up all message-related data...');

  // Delete all messages
  const messages = await db.message.deleteMany({});
  console.log(`Deleted ${messages.count} messages.`);

  // Delete all AI usage records
  const usage = await db.aIUsage.deleteMany({});
  console.log(`Deleted ${usage.count} usage records.`);

  // Delete all message transactions
  const tx = await db.messageTransaction.deleteMany({});
  console.log(`Deleted ${tx.count} transactions.`);

  // Update all users: reset usage and give 1000 starting messages
  const users = await db.user.updateMany({
    data: {
      totalMessagesUsed: 0,
      messagesRemaining: 1000
    }
  });
  console.log(`Reset ${users.count} users (Total Used: 0, Remaining: 1000).`);

  // Log a new starting transaction for each user
  const allUsers = await db.user.findMany();
  for (const u of allUsers) {
    await db.messageTransaction.create({
      data: {
        userId: u.id,
        amount: 1000,
        type: 'bonus',
        description: 'System Reset: Fresh Start Bonus'
      }
    });
  }
  console.log('Created fresh start bonus transactions.');
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
