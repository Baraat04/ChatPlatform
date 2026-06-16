const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 
async function check() { 
    const c = await prisma.channel.findMany({where:{platform:'INSTAGRAM'}}); 
    console.log("CHANNELS:", JSON.stringify(c, null, 2)); 
    const b = await prisma.bot.findMany({where:{platform:'INSTAGRAM'}}); 
    console.log("BOTS:", JSON.stringify(b, null, 2)); 
    await prisma.$disconnect(); 
} 
check();
