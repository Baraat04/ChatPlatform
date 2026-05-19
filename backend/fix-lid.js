import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config({ path: '.env' })
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function fixDB() {
    const contacts = await prisma.contact.findMany()
    const nameToJid = new Map()
    // First pass: find JIDs
    for (const c of contacts) {
        if (c.chatId.includes('@s.whatsapp.net') && c.name && c.name !== 'Contact') {
            nameToJid.set(c.name, c.chatId)
        }
    }
    
    // Second pass: fix LIDs
    for (const c of contacts) {
        if (c.chatId.includes('@lid') && c.name && nameToJid.has(c.name)) {
            const realJid = nameToJid.get(c.name)
            console.log(`Migrating messages from LID ${c.chatId} to JID ${realJid} for user ${c.name}`)
            
            // Migrate messages
            await prisma.message.updateMany({
                where: { chatId: c.chatId },
                data: { chatId: realJid }
            })
            
            // Delete the LID contact
            await prisma.contact.delete({
                where: { id: c.id }
            })
        }
    }
    console.log('Migration complete.')
}

fixDB().then(() => process.exit(0))
