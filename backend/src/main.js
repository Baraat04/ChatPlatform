import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

// Load env FIRST before any other module runs
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '../.env') })

// Global error handlers to prevent silent crashes
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:', err)
})
process.on('unhandledRejection', (reason, promise) => {
    console.error('UNHANDLED REJECTION at:', promise, 'reason:', reason)
})

import { createServer } from 'http'

// Dynamic imports so env vars are available when these modules initialize
const { default: express } = await import('express')
const { default: cors } = await import('cors')
const { Server } = await import('socket.io')
const { default: botRouter } = await import('./routes/bot-routes.js')

const app = express()
const httpServer = createServer(app)

const io = new Server(httpServer, {
    cors: {
        origin: '*',
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
})

// Store io globally so routes can access it
app.set('io', io)

app.use(cors({
    origin: '*',
    methods: ["GET", "POST", "PUT", "DELETE"]
}))
app.use(express.json())

// Global Request Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

app.use('/api', botRouter)

const PORT = process.env.PORT || 3001

httpServer.listen(PORT, async () => {
    console.log(`Listening on PORT ${PORT} with WebSockets enabled`)
    
    // Auto-restart active WhatsApp bots on server boot
    try {
        const { prisma: getPrisma } = await import('./routes/bot-routes.js')
        const prisma = getPrisma()
        
        const { startWhatsAppBot } = await import('./services/whatsapp.js')
        
        const activeBots = await prisma.bot.findMany({
            where: { platform: 'WHATSAPP', isActive: true }
        })
        
        for (const bot of activeBots) {
            console.log(`[Boot] Restoring WhatsApp Bot ${bot.id}...`)
            startWhatsAppBot(bot, prisma, io)
        }
    } catch (err) {
        console.error("Error restoring bots on boot:", err)
    }
})