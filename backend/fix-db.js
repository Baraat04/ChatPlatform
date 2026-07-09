import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fix() {
    console.log('Fetching messages with sender bot that are first in chat...');
    try {
        // We want to convert ANY message with sender='bot' that causes the sequence issue to 'user'
        // Or simply delete the exact auto-greeting message
        const messages = await prisma.message.findMany({
            where: {
                sender: 'bot',
                text: { contains: 'Автоматическое приветствие' } // This won't work, WA adds this label in UI
            }
        });
        
        // Find ALL bot messages that contain 'Привет' and 'Вы написали по курсу'
        const botMessages = await prisma.message.findMany({
            where: {
                sender: 'bot',
                text: { contains: 'Вы написали по курсу' }
            }
        });
        
        console.log(`Found ${botMessages.length} auto-greetings. Converting them to 'user'...`);
        for (const msg of botMessages) {
            await prisma.message.update({
                where: { id: msg.id },
                data: { sender: 'user' }
            });
        }
        
        // General fix: If the most recent 8 messages start with 'bot', it crashes.
        // To be absolutely safe, let's just make sure NO bot messages are adjacent to each other
        // Actually, changing the auto-greeting to 'user' is enough.
        console.log('Done!');
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
fix();
