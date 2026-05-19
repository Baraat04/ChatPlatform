import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const bots = await prisma.bot.findMany({
    orderBy: { createdAt: 'desc' }
  });
  
  if (bots.length > 0) {
      const latestBot = bots[0];
      console.log('Keeping bot active:', latestBot.id);
      for (let i = 1; i < bots.length; i++) {
          if (bots[i].isActive) {
              await prisma.bot.update({
                  where: { id: bots[i].id },
                  data: { isActive: false }
              });
              console.log('Deactivated old bot:', bots[i].id);
          }
      }
      
      console.log('Cleaning up duplicate echoes in the database...');
      // Merge LID into JID for all contacts
      const contacts = await prisma.contact.findMany({
          where: { botId: latestBot.id, chatId: { contains: '@lid' } }
      });
      
      for (const contact of contacts) {
          if (contact.realJid) {
              // Move all messages from LID to JID
              await prisma.message.updateMany({
                  where: { botId: latestBot.id, chatId: contact.chatId },
                  data: { chatId: contact.realJid }
              });
              
              // Ensure JID contact has the LID name
              const jidContact = await prisma.contact.findUnique({
                  where: { botId_chatId: { botId: latestBot.id, chatId: contact.realJid } }
              });
              
              if (jidContact && contact.name && contact.name !== 'Contact') {
                  await prisma.contact.update({
                      where: { botId_chatId: { botId: latestBot.id, chatId: contact.realJid } },
                      data: { name: contact.name }
                  });
              }
              // Delete the LID contact to avoid duplicates
              await prisma.contact.delete({
                  where: { botId_chatId: { botId: latestBot.id, chatId: contact.chatId } }
              });
          }
      }
      console.log('Cleanup complete!');
  }
}
run();
