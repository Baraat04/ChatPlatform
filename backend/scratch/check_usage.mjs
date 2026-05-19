import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@127.0.0.1:5435/ai-consultant?schema=public', max: 2 });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const count = await prisma.aIUsage.count();
const users = await prisma.user.findMany({ select: { id: true, name: true, messagesRemaining: true, totalMessagesUsed: true } });
const transactions = await prisma.messageTransaction.findMany({ orderBy: { createdAt: 'desc' }, take: 5 });

console.log('AIUsage records:', count);
console.log('Users:', JSON.stringify(users, null, 2));
console.log('Recent transactions:', JSON.stringify(transactions, null, 2));
await prisma.$disconnect();
process.exit(0);
