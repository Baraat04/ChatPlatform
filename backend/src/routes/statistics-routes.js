// statistics-routes.js - Advanced Analytics API endpoints
import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { addMessages } from '../services/usage-tracker.js';

const router = express.Router();
let _prisma = null;

export function setStatisticsPrisma(prismaInstance) {
  _prisma = prismaInstance;
}

// 1. GET /api/statistics/overview - Aggregated stats
router.get('/overview', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const user = await _prisma.user.findUnique({
      where: { id: userId },
      select: { messagesRemaining: true, totalMessagesUsed: true },
    });

    const usageAgg = await _prisma.aIUsage.aggregate({
      where: { userId },
      _sum: { providerCost: true, totalTokens: true, messagesUsed: true },
      _count: { id: true },
    });

    // Today's usage
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayAgg = await _prisma.aIUsage.aggregate({
      where: { userId, createdAt: { gte: today } },
      _sum: { messagesUsed: true },
    });

    res.json({
      messagesRemaining: user?.messagesRemaining || 0,
      totalMessagesUsed: user?.totalMessagesUsed || 0,
      totalTokens: usageAgg._sum.totalTokens || 0,
      avgTokensPerMessage: usageAgg._sum.messagesUsed > 0 ? Math.round(usageAgg._sum.totalTokens / usageAgg._sum.messagesUsed) : 0,
      totalRequests: usageAgg._count.id || 0,
      todayUsage: todayAgg._sum.messagesUsed || 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. GET /api/statistics/per-bot - Stats per bot
router.get('/per-bot', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const records = await _prisma.aIUsage.groupBy({
      by: ['botId'],
      where: { userId },
      _sum: { messagesUsed: true, totalTokens: true },
      _count: { id: true },
    });

    const botIds = records.map(r => r.botId);
    const bots = await _prisma.bot.findMany({
      where: { id: { in: botIds } },
      select: { id: true, slug: true, platform: true },
    });
    const botMap = Object.fromEntries(bots.map(b => [b.id, b]));

    res.json(records.map(r => ({
      botId: r.botId,
      slug: botMap[r.botId]?.slug || `Bot ${r.botId}`,
      platform: botMap[r.botId]?.platform || 'UNKNOWN',
      messagesUsed: r._sum.messagesUsed || 0,
      requests: r._count.id || 0,
      // Efficiency = messages / requests (closer to 1.0 is better)
      efficiency: r._count.id > 0 ? parseFloat((r._sum.messagesUsed / r._count.id).toFixed(2)) : 0,
      throughput: r._sum.totalTokens || 0,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. GET /api/statistics/usage-history - Daily stats for SVG chart
router.get('/usage-history', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const days = parseInt(req.query.range) || 7;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const records = await _prisma.aIUsage.findMany({
      where: { userId, createdAt: { gte: since } },
      select: { createdAt: true, messagesUsed: true },
      orderBy: { createdAt: 'asc' },
    });

    const byDate = {};
    for (const r of records) {
      const date = r.createdAt.toISOString().split('T')[0];
      byDate[date] = (byDate[date] || 0) + r.messagesUsed;
    }

    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      result.push({ date: dateStr, value: byDate[dateStr] || 0 });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. GET /api/statistics/transactions - Paginated ledger
router.get('/transactions', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      _prisma.messageTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      _prisma.messageTransaction.count({ where: { userId } }),
    ]);

    res.json({ transactions, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. POST /api/statistics/purchase - Message bundle purchase
router.post('/purchase', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { plan } = req.body;

    const BUNDLES = {
      starter: { amount: 1000, cost: 10, name: 'Starter' },
      growth: { amount: 6000, cost: 50, name: 'Growth (Bonus!)' },
      pro: { amount: 30000, cost: 200, name: 'Pro (Max Bonus!)' },
    };

    const bundle = BUNDLES[plan];
    if (!bundle) return res.status(400).json({ error: 'Invalid plan' });

    await addMessages(userId, bundle.amount, `Purchase: ${bundle.name} bundle ($${bundle.cost})`, 'purchase');

    res.json({ success: true, added: bundle.amount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get('/admin-analytics', requireAuth, async (req, res) => {
  console.log('--- ADMIN ANALYTICS HIT ---');
  try {
    // Always recalculate costs using correct pricing from raw tokens (not stored providerCost)
    const INPUT_PRICE_PER_MILLION  = 0.25;
    const OUTPUT_PRICE_PER_MILLION = 1.50;

    const calcCost = (inp, out) =>
      (inp / 1_000_000) * INPUT_PRICE_PER_MILLION + (out / 1_000_000) * OUTPUT_PRICE_PER_MILLION;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayRaw = await _prisma.aIUsage.aggregate({
      where: { createdAt: { gte: today } },
      _sum: { inputTokens: true, outputTokens: true, totalTokens: true, messagesUsed: true }
    });

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const monthRaw = await _prisma.aIUsage.aggregate({
      where: { createdAt: { gte: monthStart } },
      _sum: { inputTokens: true, outputTokens: true, totalTokens: true, messagesUsed: true }
    });

    const totalRaw = await _prisma.aIUsage.aggregate({
      _sum: { inputTokens: true, outputTokens: true, totalTokens: true, messagesUsed: true }
    });

    const activeBots = await _prisma.bot.count({ where: { isActive: true } });

    // Top Users
    const topUsersQuery = await _prisma.aIUsage.groupBy({
      by: ['userId'],
      _sum: { totalTokens: true, providerCost: true, messagesUsed: true },
      orderBy: { _sum: { totalTokens: 'desc' } },
      take: 10
    });

    // We need to fetch User names manually since groupBy doesn't support relation fetching natively
    const topUsers = [];
    for (const tu of topUsersQuery) {
      const user = await _prisma.user.findUnique({ where: { id: tu.userId }});
      const inpTkn = tu._sum.totalTokens ? Math.round(tu._sum.totalTokens * 0.75) : 0;
      const outTkn = tu._sum.totalTokens ? Math.round(tu._sum.totalTokens * 0.25) : 0;
      topUsers.push({
        id: tu.userId,
        name: user ? user.name : `User ${tu.userId}`,
        tokens: tu._sum.totalTokens || 0,
        cost: calcCost(inpTkn, outTkn),
        messages: tu._sum.messagesUsed || 0
      });
    }

    // Rough estimated token breakdown for Gemini (History, System, Input, Output)
    const breakdown = [
      { name: 'History Context', value: Math.floor((totalRaw._sum.totalTokens || 0) * 0.50), color: '#10b981' },
      { name: 'System Prompt', value: Math.floor((totalRaw._sum.totalTokens || 0) * 0.20), color: '#3b82f6' },
      { name: 'RAG Context', value: Math.floor((totalRaw._sum.totalTokens || 0) * 0.15), color: '#8b5cf6' },
      { name: 'User Input', value: Math.floor((totalRaw._sum.totalTokens || 0) * 0.05), color: '#f59e0b' },
      { name: 'Model Output', value: Math.floor((totalRaw._sum.totalTokens || 0) * 0.10), color: '#ec4899' },
    ];

    // Daily usage for last 7 days
    const dailyUsage = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date();
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);
      const dayAgg = await _prisma.aIUsage.aggregate({
        where: { createdAt: { gte: dayStart, lte: dayEnd } },
        _sum: { totalTokens: true, messagesUsed: true }
      });
      dailyUsage.push({
        name: dayStart.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
        tokens: dayAgg._sum.totalTokens || 0,
        messages: dayAgg._sum.messagesUsed || 0
      });
    }

    // Detailed recent requests (last 50) with full breakdown
    const INPUT_PRICE = 0.25;   // per 1M tokens
    const OUTPUT_PRICE = 1.50;  // per 1M tokens

    const rawRequests = await _prisma.aIUsage.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Fetch user names for these requests
    const userIds = [...new Set(rawRequests.map(r => r.userId))];
    const users = await _prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true }
    });
    const userMap = Object.fromEntries(users.map(u => [u.id, u.name]));

    const recentRequests = rawRequests.map(r => {
      const inputCost = (r.inputTokens / 1_000_000) * INPUT_PRICE;
      const outputCost = (r.outputTokens / 1_000_000) * OUTPUT_PRICE;
      // Estimated component breakdown of input tokens
      const est = {
        history:    Math.round(r.inputTokens * 0.50),
        systemPrompt: Math.round(r.inputTokens * 0.20),
        ragData:    Math.round(r.inputTokens * 0.15),
        userMsg:    Math.round(r.inputTokens * 0.15),
      };
      return {
        id: r.id,
        userName: userMap[r.userId] || `User ${r.userId}`,
        model: r.model,
        createdAt: r.createdAt,
        inputTokens: r.inputTokens,
        outputTokens: r.outputTokens,
        totalTokens: r.totalTokens,
        inputCost: parseFloat(inputCost.toFixed(7)),
        outputCost: parseFloat(outputCost.toFixed(7)),
        totalCost: parseFloat((inputCost + outputCost).toFixed(7)),
        estimatedBreakdown: est,
      };
    });

    // Per-user aggregated stats
    const perUserStats = [];
    for (const uid of userIds) {
      const userRequests = rawRequests.filter(r => r.userId === uid);
      const totalInput = userRequests.reduce((s, r) => s + r.inputTokens, 0);
      const totalOutput = userRequests.reduce((s, r) => s + r.outputTokens, 0);
      const count = userRequests.length;
      const totalInputCost = (totalInput / 1_000_000) * INPUT_PRICE;
      const totalOutputCost = (totalOutput / 1_000_000) * OUTPUT_PRICE;
      perUserStats.push({
        userId: uid,
        userName: userMap[uid] || `User ${uid}`,
        requests: count,
        avgInputTokens: count > 0 ? Math.round(totalInput / count) : 0,
        avgOutputTokens: count > 0 ? Math.round(totalOutput / count) : 0,
        totalInputTokens: totalInput,
        totalOutputTokens: totalOutput,
        totalInputCost: parseFloat(totalInputCost.toFixed(6)),
        totalOutputCost: parseFloat(totalOutputCost.toFixed(6)),
        totalCost: parseFloat((totalInputCost + totalOutputCost).toFixed(6)),
      });
    }
    perUserStats.sort((a, b) => b.totalCost - a.totalCost);

    const totalSpendToday = calcCost(todayRaw._sum.inputTokens || 0, todayRaw._sum.outputTokens || 0);
    const totalSpendMonth = calcCost(monthRaw._sum.inputTokens || 0, monthRaw._sum.outputTokens || 0);
    const totalSpendAll   = calcCost(totalRaw._sum.inputTokens || 0, totalRaw._sum.outputTokens || 0);
    const totalMsgs       = totalRaw._sum.messagesUsed || 0;
    const totalReqs       = await _prisma.aIUsage.count();

    // Global averages across ALL requests
    const avgStats = {
      avgInputTokens:  totalReqs > 0 ? Math.round((totalRaw._sum.inputTokens  || 0) / totalReqs) : 0,
      avgOutputTokens: totalReqs > 0 ? Math.round((totalRaw._sum.outputTokens || 0) / totalReqs) : 0,
      avgTotalTokens:  totalReqs > 0 ? Math.round((totalRaw._sum.totalTokens  || 0) / totalReqs) : 0,
      totalRequests: totalReqs,
    };

    res.json({
      stats: {
        totalSpendToday,
        totalSpendMonth,
        avgCostPerMessage: totalMsgs > 0 ? totalSpendAll / totalMsgs : 0,
        totalMessages: totalMsgs,
        activeBots
      },
      usageBreakdown: breakdown,
      topUsers,
      dailyUsage,
      recentRequests,
      perUserStats,
      avgStats,
      pricing: { inputPerMillion: INPUT_PRICE_PER_MILLION, outputPerMillion: OUTPUT_PRICE_PER_MILLION }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
