const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 
async function check() { 
    const c = await prisma.channel.findMany({where:{platform:'INSTAGRAM'}}); 
    console.log(c); 
    await prisma.$disconnect(); 
} 
check();
