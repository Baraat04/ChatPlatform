import { Router } from 'express'
import { prisma as getPrisma } from './bot-routes.js'

const router = Router()

// Simple middleware to check admin password via header
const requireAdminPass = (req, res, next) => {
    const pass = req.headers['x-admin-pass'];
    if (pass !== 'admindalvnos') {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};

// GET all users
router.get('/users', requireAdminPass, async (req, res) => {
    try {
        const prisma = getPrisma()
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                subscriptionPlan: true,
                subscriptionExpiresAt: true,
                messagesRemaining: true,
                totalMessagesUsed: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' }
        })
        res.json(users)
    } catch (e) {
        res.status(500).json({ error: e.message })
    }
})

// GET detailed user stats
router.get('/users/:id', requireAdminPass, async (req, res) => {
    try {
        const prisma = getPrisma()
        const userId = Number(req.params.id)

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                bots: {
                    select: {
                        id: true,
                        slug: true,
                        platform: true,
                        isActive: true,
                        createdAt: true,
                        updatedAt: true,
                        _count: {
                            select: { messages: true }
                        }
                    }
                }
            }
        });

        if (!user) return res.status(404).json({ error: 'User not found' });

        // Get AI Usage grouped by date for the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const aiUsage = await prisma.aIUsage.findMany({
            where: {
                userId,
                createdAt: {
                    gte: thirtyDaysAgo
                }
            },
            select: {
                createdAt: true,
                messagesUsed: true
            }
        });

        // Group usage by date (YYYY-MM-DD)
        const usageByDate = {};
        aiUsage.forEach(usage => {
            const dateStr = usage.createdAt.toISOString().split('T')[0];
            if (!usageByDate[dateStr]) usageByDate[dateStr] = 0;
            usageByDate[dateStr] += usage.messagesUsed;
        });

        // Format for recharts
        const usageChartData = Object.keys(usageByDate).map(date => ({
            date,
            messages: usageByDate[date]
        })).sort((a, b) => new Date(a.date) - new Date(b.date));

        res.json({ user, usageChartData });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// UPDATE user plan
router.put('/users/:id/plan', requireAdminPass, async (req, res) => {
    try {
        const prisma = getPrisma()
        const { plan } = req.body
        const userId = Number(req.params.id)

        let updateData = { subscriptionPlan: plan }
        
        // Reset limits based on plan
        if (plan === 'FREE') {
            updateData.messagesRemaining = 100;
        } else if (plan === 'STARTER' || plan === 'BASIC') {
            updateData.messagesRemaining = 1000;
        } else if (plan === 'GROWTH') {
            updateData.messagesRemaining = 6000;
        } else if (plan === 'PRO') {
            updateData.messagesRemaining = 15000;
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: updateData
        })
        
        res.json({ success: true, user })
    } catch (e) {
        res.status(500).json({ error: e.message })
    }
})

// CREATE new user
router.post('/users', requireAdminPass, async (req, res) => {
    try {
        const prisma = getPrisma();
        const { email, password, name, plan } = req.body;
        
        // Simple validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // We use bcrypt to hash the password
        const bcrypt = await import('bcryptjs');
        const salt = await bcrypt.default.genSalt(10);
        const hashedPassword = await bcrypt.default.hash(password, salt);

        let messagesRemaining = 100;
        if (plan === 'STARTER' || plan === 'BASIC') messagesRemaining = 1000;
        else if (plan === 'GROWTH') messagesRemaining = 6000;
        else if (plan === 'PRO') messagesRemaining = 15000;

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: name || 'Без имени',
                isVerified: true,
                subscriptionPlan: plan || 'FREE',
                messagesRemaining
            }
        });

        res.json({ success: true, user });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// DELETE user
router.delete('/users/:id', requireAdminPass, async (req, res) => {
    try {
        const prisma = getPrisma();
        const userId = Number(req.params.id);
        
        await prisma.user.delete({
            where: { id: userId }
        });
        
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

export default router
