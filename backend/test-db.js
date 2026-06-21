// test script for DB
async function run() {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    try {
        const bots = await prisma.bot.findMany({ select: { id: true, name: true, googleCalendarId: true }});
        console.log(JSON.stringify(bots, null, 2));
    } finally {
        await prisma.$disconnect();
    }
}
run().catch(console.error);
