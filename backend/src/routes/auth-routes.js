import express from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from './bot-routes.js';

const router = express.Router();

router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const db = prisma();
        const existing = await db.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await db.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                messagesRemaining: 1000,
                messageTransactions: {
                    create: {
                        amount: 1000,
                        type: 'bonus',
                        description: 'Welcome Bonus'
                    }
                }
            }
        });

        // Auto login after register
        req.session.userId = user.id;
        
        res.status(201).json({ user: { id: user.id, name: user.name, email: user.email } });
    } catch (e) {
        console.error('Registration error:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Missing email or password' });
        }

        const db = prisma();
        const user = await db.user.findUnique({ where: { email } });
        
        if (!user || !user.password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        req.session.userId = user.id;
        res.json({ user: { id: user.id, name: user.name, email: user.email } });
    } catch (e) {
        console.error('Login error:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).json({ error: 'Could not log out' });
        res.clearCookie('connect.sid');
        res.json({ message: 'Logged out successfully' });
    });
});

router.get('/profile', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    try {
        const db = prisma();
        const user = await db.user.findUnique({ where: { id: req.session.userId } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ user: { id: user.id, name: user.name, email: user.email, messagesRemaining: user.messagesRemaining, totalMessagesUsed: user.totalMessagesUsed } });
    } catch (e) {
        console.error('Profile fetch error:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
