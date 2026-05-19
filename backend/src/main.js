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
const { default: expressSession } = await import('express-session')
const connectPgSimple = (await import('connect-pg-simple')).default
const pgPkg = await import('pg')
const { prisma: getPrisma } = await import('./routes/bot-routes.js')
const { default: botRouter } = await import('./routes/bot-routes.js')
const { default: authRouter } = await import('./routes/auth-routes.js')
const { default: statisticsRouter, setStatisticsPrisma } = await import('./routes/statistics-routes.js')
const { setTrackerPrisma } = await import('./services/usage-tracker.js')

const app = express()
const httpServer = createServer(app)

const io = new Server(httpServer, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
    }
})

// Store io globally so routes can access it
app.set('io', io)

app.use(cors({
    origin: 'http://localhost:3000',
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}))
app.use(express.json())

// Global Request Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Configure Session Middleware
// Use connect-pg-simple for persistent sessions that survive restarts
const PgStore = connectPgSimple(expressSession)
const sessionPool = new pgPkg.Pool({ connectionString: process.env.DATABASE_URL, max: 2 })

// Ensure user_sessions table exists in PostgreSQL database
try {
  await sessionPool.query(`
    CREATE TABLE IF NOT EXISTS "user_sessions" (
      "sid" varchar NOT NULL COLLATE "default",
      "sess" json NOT NULL,
      "expire" timestamp(6) NOT NULL
    ) WITH (OIDS=FALSE);
  `);
  try {
    await sessionPool.query(`ALTER TABLE "user_sessions" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;`);
  } catch (pkeyErr) {
    // Primary key already exists
  }
  await sessionPool.query(`CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "user_sessions" ("expire");`);
  console.log('[Sessions] user_sessions table created/verified successfully.');
} catch (tableErr) {
  console.error('[Sessions] Error verifying/creating user_sessions table:', tableErr);
}

app.use(
  expressSession({
    store: new PgStore({
      pool: sessionPool,
      tableName: 'user_sessions',
      createTableIfMissing: true,
    }),
    cookie: {
     maxAge: 7 * 24 * 60 * 60 * 1000 // 1 week
    },
    secret: process.env.SESSION_SECRET || 'super_secret_session_key',
    resave: false,
    saveUninitialized: false,
  })
);

import fs from 'fs'

const uploadDir = path.join(__dirname, '../../uploads')
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
}
app.use('/uploads', express.static(uploadDir))

app.use('/api/auth', authRouter)
app.use('/api/statistics', statisticsRouter)
app.use('/api', botRouter)

// Initialize services with the shared prisma instance
const prismaInstance = getPrisma()
setStatisticsPrisma(prismaInstance)
setTrackerPrisma(prismaInstance)

const PORT = process.env.PORT || 3001

httpServer.listen(PORT, async () => {
    console.log(`Listening on PORT ${PORT} with WebSockets enabled`)
    
    // Auto-restart active WhatsApp bots on server boot
    try {
        const { prisma: getPrisma } = await import('./routes/bot-routes.js')
        const prisma = getPrisma()
        
        const { startWhatsAppBot } = await import('./services/whatsapp.js')
        
        // FIX GHOST BOTS: Only allow ONE active WhatsApp bot per user
        const allActiveBots = await prisma.bot.findMany({
            where: { platform: 'WHATSAPP', isActive: true },
            orderBy: { createdAt: 'desc' }
        })
        
        let activeBots = [];
        const userSeen = new Set();
        
        for (const b of allActiveBots) {
            if (!userSeen.has(b.user_id)) {
                userSeen.add(b.user_id);
                activeBots.push(b);
            } else {
                console.log(`[Boot] Deactivating old ghost bot ${b.id} for user ${b.user_id}`);
                await prisma.bot.update({ where: { id: b.id }, data: { isActive: false } });
            }
        }
        
        // AUTO-CLEANUP: Merge any remaining @lid duplicate messages
        if (activeBots.length > 0) {
            const latestBot = activeBots[0];
            const lidContacts = await prisma.contact.findMany({
                where: { botId: latestBot.id, chatId: { contains: '@lid' } }
            });
            for (const c of lidContacts) {
                if (c.realJid) {
                    await prisma.message.updateMany({
                        where: { botId: latestBot.id, chatId: c.chatId },
                        data: { chatId: c.realJid }
                    });
                    
                    const existing = await prisma.contact.findUnique({
                        where: { botId_chatId: { botId: latestBot.id, chatId: c.realJid } }
                    });
                    
                    if (existing && c.name && c.name !== 'Contact') {
                        await prisma.contact.update({
                            where: { botId_chatId: { botId: latestBot.id, chatId: c.realJid } },
                            data: { name: c.name }
                        });
                    }
                    
                    await prisma.contact.delete({
                        where: { botId_chatId: { botId: latestBot.id, chatId: c.chatId } }
                    });
                }
            }
        }
        
        for (const bot of activeBots) {
            console.log(`[Boot] Restoring WhatsApp Bot ${bot.id}...`)
            startWhatsAppBot(bot, prisma, io)
        }
    } catch (err) {
        console.error("Error restoring bots on boot:", err)
    }
})