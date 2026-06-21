import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { prisma as getPrisma } from './bot-routes.js';
import { processAnalyticsJobs } from '../services/analytics-worker.js';
import { runCompletionCheck } from '../services/completion-checker.js';

const router = express.Router();

// 1. Manually trigger the deep analytics worker (PRO/GROWTH only)
router.post('/analytics/trigger-worker', requireAuth, async (req, res) => {
    try {
        const { specificChatId, limit = 20 } = req.body;

        const prisma = getPrisma();
        const user = await prisma.user.findUnique({ where: { id: req.session.userId } });
        if (!['PRO', 'GROWTH'].includes(user.subscriptionPlan)) {
            return res.status(403).json({ error: 'Аналитика доступна только на тарифах PRO и GROWTH' });
        }

        const bots = await prisma.bot.findMany({ where: { user_id: req.session.userId }, select: { id: true } });
        const botIds = bots.map(b => b.id);

        let whereClause = { botId: { in: botIds } };
        if (specificChatId) whereClause.chatId = specificChatId;

        const contacts = await prisma.contact.findMany({
            where: whereClause,
            orderBy: { updatedAt: 'desc' },
            take: limit
        });

        let enqueued = 0;
        for (const c of contacts) {
            const pending = await prisma.backgroundJob.findFirst({
                where: { botId: c.botId, type: 'ANALYZE_CHAT', payload: JSON.stringify({ chatId: c.chatId }), status: 'PENDING' }
            });
            if (!pending) {
                await prisma.backgroundJob.create({
                    data: { botId: c.botId, type: 'ANALYZE_CHAT', payload: JSON.stringify({ chatId: c.chatId }), status: 'PENDING' }
                });
                enqueued++;
            }
        }

        const result = await processAnalyticsJobs();
        res.json({ success: true, processed: result.processed, enqueued, message: `Добавлено ${enqueued} чатов в очередь. Проанализировано ${result.processed}.` });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 2. Refresh ALL chat statuses for a bot (manual trigger of CompletionChecker)
router.post('/bot/:botId/refresh-statuses', requireAuth, async (req, res) => {
    try {
        const prisma = getPrisma();
        const botId = Number(req.params.botId);
        const bot = await prisma.bot.findUnique({ where: { id: botId, user_id: req.session.userId } });
        if (!bot) return res.status(404).json({ error: 'Bot not found' });

        const io = req.app.get('io');
        await runCompletionCheck(botId, io);

        res.json({ success: true, message: 'Статусы диалогов обновлены.' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 3. Refresh ONE specific chat status
router.post('/bot/:botId/refresh-status/:chatId', requireAuth, async (req, res) => {
    try {
        const prisma = getPrisma();
        const botId = Number(req.params.botId);
        const chatId = req.params.chatId;
        const io = req.app.get('io');

        const bot = await prisma.bot.findUnique({ where: { id: botId, user_id: req.session.userId } });
        if (!bot) return res.status(404).json({ error: 'Bot not found' });

        await runCompletionCheck(botId, io, chatId);

        res.json({ success: true, message: 'Статус диалога обновлён.' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 4. Get analytics data for a bot
router.get('/analytics/:botId', requireAuth, async (req, res) => {
    try {
        const prisma = getPrisma();
        const botId = Number(req.params.botId);
        const user = await prisma.user.findUnique({ where: { id: req.session.userId } });
        const isPremium = ['PRO', 'GROWTH'].includes(user.subscriptionPlan);

        const bot = await prisma.bot.findUnique({ where: { id: botId, user_id: req.session.userId } });
        if (!bot) return res.status(404).json({ error: 'Bot not found' });

        if (!isPremium) {
            return res.status(403).json({ error: 'Аналитика доступна только на тарифах PRO и GROWTH', requiresUpgrade: true });
        }

        const analytics = await prisma.chatAnalytics.findMany({
            where: { botId },
            orderBy: { lastAnalyzed: 'desc' }
        });

        const funnelCounts = {};
        let totalScore = 0;
        let scoredCount = 0;
        const dropOffReasons = [];

        analytics.forEach(a => {
            funnelCounts[a.funnelStage] = (funnelCounts[a.funnelStage] || 0) + 1;
            if (a.score !== null) { totalScore += a.score; scoredCount++; }
            if (a.dropOffReason && a.dropOffReason.trim() !== '') dropOffReasons.push(a.dropOffReason);
        });

        const averageScore = scoredCount > 0 ? Math.round(totalScore / scoredCount) : 0;

        res.json({ success: true, totalChatsAnalyzed: analytics.length, funnelCounts, averageScore, dropOffReasons, chatAnalytics: analytics });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
