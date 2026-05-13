import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '.env') })

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function dump() {
    try {
        const msgs = await prisma.message.findMany({
            select: { id: true, chatId: true, text: true, sender: true },
            take: 10,
            orderBy: { createdAt: 'desc' }
        })
        console.log(JSON.stringify(msgs, null, 2))
    } finally {
        await prisma.$disconnect()
        await pool.end()
    }
}
dump()
