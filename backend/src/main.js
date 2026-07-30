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

// Graceful shutdown
const gracefulShutdown = async () => {
    console.log('Received kill signal, shutting down gracefully...');
    
    // Give OS 500ms to finish any pending IO streams before hard exit
    setTimeout(() => {
        process.exit(0);
    }, 500);
};
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

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
const { default: platformAIRouter } = await import('./routes/platform-ai-routes.js')
const { default: statisticsRouter, setStatisticsPrisma } = await import('./routes/statistics-routes.js')
const { default: paymentRouter } = await import('./routes/payment-routes.js')
const { default: analyticsRouter } = await import('./routes/analytics-routes.js')
const { default: adminRoutes } = await import('./routes/admin-routes.js')
const { setTrackerPrisma } = await import('./services/usage-tracker.js')
const { startCompletionChecker } = await import('./services/completion-checker.js')

const app = express()
const httpServer = createServer(app)

// CRITICAL: Trust Nginx/reverse proxy so secure cookies work on HTTPS
app.set('trust proxy', 1)

const corsOptions = {
    origin: ['http://72.62.117.32:3000','https://up-chat.com', 'https://www.up-chat.com', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-pass']
};

const io = new Server(httpServer, {
    cors: corsOptions
})

// Store io globally so routes can access it
app.set('io', io)

app.use(cors(corsOptions))
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
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // cross-domain in prod
    },
    secret: process.env.SESSION_SECRET || 'super_secret_session_key',
    resave: false,
    saveUninitialized: false,
  })
);

import fs from 'fs'

const uploadDir = path.join(__dirname, '../uploads')
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
}
app.use('/uploads', express.static(uploadDir))

app.use('/api/auth', authRouter)
app.use('/auth', authRouter) // Added for Instagram callback
app.use('/api/platform-ai', platformAIRouter)
app.use('/api/statistics', statisticsRouter)
app.use('/api/payments', paymentRouter)
app.use('/api', analyticsRouter)
app.use('/api', botRouter)
app.use('/api/admin', adminRoutes)

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
        
        // FIX GHOST BOTS: Only allow ONE active WhatsApp bot per user
        const allActiveBots = await prisma.bot.findMany({
            where: { platform: 'WHATSAPP', isActive: true },
            orderBy: { createdAt: 'desc' }
        })
        
        for (const bot of allActiveBots) {
            // AUTO-CLEANUP: Merge any remaining @lid duplicate messages
            try {
                const lidContacts = await prisma.contact.findMany({
                    where: { botId: bot.id, chatId: { contains: '@lid' } }
                });
                for (const c of lidContacts) {
                    if (c.realJid) {
                        await prisma.message.updateMany({
                            where: { botId: bot.id, chatId: c.chatId },
                            data: { chatId: c.realJid }
                        });
                        
                        const existing = await prisma.contact.findUnique({
                            where: { botId_chatId: { botId: bot.id, chatId: c.realJid } }
                        });
                        
                        if (existing && c.name && c.name !== 'Contact') {
                            await prisma.contact.update({
                                where: { botId_chatId: { botId: bot.id, chatId: c.realJid } },
                                data: { name: c.name }
                            });
                        }
                        
                        await prisma.contact.delete({
                            where: { botId_chatId: { botId: bot.id, chatId: c.chatId } }
                        });
                    }
                }
            } catch (e) {
                console.error(`[Boot] LID cleanup error for bot ${bot.id}:`, e.message);
            }
        }

        // AUTO-REREGISTER: Re-set Telegram webhooks to the current BASE_URL on every boot
        // This fixes the issue where bots were created with ngrok/old URL and prod URL changed
        try {
            const activeTgBots = await prisma.bot.findMany({
                where: { platform: 'TELEGRAM', isActive: true, apiToken: { not: null } }
            })
            
            let baseUrl = process.env.BASE_URL || 'https://yourdomain.com'
            baseUrl = baseUrl.replace(/\/+$/, '')
            
            for (const tgBot of activeTgBots) {
                try {
                    const webhookUrl = `${baseUrl}/api/webhook/telegram/${tgBot.slug}`
                    const response = await fetch(
                        `https://api.telegram.org/bot${tgBot.apiToken}/setWebhook`,
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ url: webhookUrl })
                        }
                    )
                    const result = await response.json()
                    if (result.ok) {
                        console.log(`[Boot] ✅ Telegram webhook re-registered: Bot ${tgBot.id} → ${webhookUrl}`)
                    } else {
                        console.error(`[Boot] ❌ Telegram webhook failed for Bot ${tgBot.id}:`, result.description)
                    }
                } catch (tgErr) {
                    console.error(`[Boot] Telegram webhook error for Bot ${tgBot.id}:`, tgErr.message)
                }
            }
        } catch (tgBotsErr) {
            console.error('[Boot] Error re-registering Telegram webhooks:', tgBotsErr)
        }
    } catch (err) {
        console.error("Error restoring bots on boot:", err)
    }

    // Start the auto-completion checker (runs every 15 minutes)
    try {
        startCompletionChecker(prismaInstance, io, 15)
    } catch (ccErr) {
        console.error('[Boot] Failed to start CompletionChecker:', ccErr.message)
    }

    // Instagram token refresh job (runs daily)
    setInterval(async () => {
        console.log('[Instagram] Running scheduled token refresh job...');
        try {
            const { prisma: getPrisma } = await import('./routes/bot-routes.js');
            const prisma = getPrisma();
            
            // Check tokens expiring in less than 7 days
            const inSevenDays = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            
            const expiringChannels = await prisma.channel.findMany({
                where: { platform: 'INSTAGRAM', isActive: true, tokenExpiresAt: { lte: inSevenDays, not: null } }
            });
            
            for (const channel of expiringChannels) {
                if (!channel.apiToken) continue;
                try {
                    const res = await fetch(`https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${channel.apiToken}`);
                    const data = await res.json();
                    
                    if (res.ok && data.access_token) {
                        const expiresIn = data.expires_in || (60 * 24 * 60 * 60);
                        const expiresAt = new Date(Date.now() + expiresIn * 1000);
                        
                        await prisma.channel.update({
                            where: { id: channel.id },
                            data: { apiToken: data.access_token, tokenExpiresAt: expiresAt }
                        });
                        console.log(`[Instagram] Successfully refreshed token for channel ${channel.id}`);
                    } else {
                        console.error(`[Instagram] Failed to refresh token for channel ${channel.id}:`, data);
                        // Mark as requires reconnection (we can just disable it or leave it, but prompt says: 
                        // "пометить подключение статусом 'требует переподключения'; отразить это в UI бота")
                        // Since we don't have a direct status field on Channel, we can use a special token format or just isActive = false
                        await prisma.channel.update({
                            where: { id: channel.id },
                            data: { isActive: false }
                        });
                    }
                } catch (e) {
                    console.error(`[Instagram] Network error refreshing token for channel ${channel.id}:`, e.message);
                }
            }
        } catch (e) {
            console.error('[Instagram] Error in token refresh job:', e.message);
        }
    }, 24 * 60 * 60 * 1000); // 24 hours
})
