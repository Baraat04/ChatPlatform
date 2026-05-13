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

async function cleanDB() {
    try {
        console.log("Очистка поломанных сообщений...")
        await prisma.message.deleteMany()
        console.log("База сообщений очищена! Начинаем с чистого листа.")
    } catch (err) {
        console.error('Ошибка:', err)
    } finally {
        await prisma.$disconnect()
        await pool.end()
        process.exit(0)
    }
}
cleanDB()
