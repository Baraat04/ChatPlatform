import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fix() {
    console.log('Scanning all chats for corrupted history sequences...');
    try {
        const chats = await prisma.message.groupBy({
            by: ['botId', 'chatId'],
        });
        
        let fixedCount = 0;
        
        for (const chat of chats) {
            const recentMessages = await prisma.message.findMany({
                where: { botId: chat.botId, chatId: chat.chatId },
                orderBy: { createdAt: 'desc' },
                take: 20
            });
            recentMessages.reverse();
            
            if (recentMessages.length <= 1) continue;
            
            // This is how history is calculated in whatsapp.js
            const history = recentMessages.slice(0, -1);
            
            let rawHistory = history.map(msg => ({
                role: msg.sender === 'bot' ? 'model' : 'user',
                id: msg.id
            }));
            
            // Simulate GeminiService.js history merging
            let mergedHistory = [];
            for (const msg of rawHistory) {
                if (mergedHistory.length > 0 && mergedHistory[mergedHistory.length - 1].role === msg.role) {
                    // merged
                } else {
                    mergedHistory.push(msg);
                }
            }
            
            let limitedHistory = mergedHistory.slice(-8);
            
            if (limitedHistory.length > 0 && limitedHistory[0].role === 'model') {
                const msgIdToFix = limitedHistory[0].id;
                console.log(`Fixing chat ${chat.chatId} (Bot ${chat.botId}) - changing message ${msgIdToFix} to 'user'`);
                await prisma.message.update({
                    where: { id: msgIdToFix },
                    data: { sender: 'user' }
                });
                fixedCount++;
            }
        }
        
        console.log(`Done! Fixed ${fixedCount} conversations.`);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
fix();
