import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const contacts = await prisma.contact.findMany();
  console.log("CONTACTS:");
  console.log(contacts);
  
  const msgs = await prisma.message.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  console.log("\nMESSAGES:");
  console.log(msgs);
}
run();
