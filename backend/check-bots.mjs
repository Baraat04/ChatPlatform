import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

const bots = await prisma.bot.findMany({ 
    select: { id: true, name: true, googleCalendarId: true, googleSheetUrl: true, bitrixWebhookUrl: true } 
});
console.log('=== BOTS IN DB ===');
console.log(JSON.stringify(bots, null, 2));
await prisma.$disconnect();
