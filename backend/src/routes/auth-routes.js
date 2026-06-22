import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from './bot-routes.js';
import { transporter } from '../services/emailService.js';

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
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
                isVerified: false,
                messagesRemaining: 100,
                messageTransactions: {
                    create: {
                        amount: 100,
                        type: 'bonus',
                        description: 'Welcome Bonus'
                    }
                }
            }
        });

        // Generate 6-digit verification code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        await db.verificationToken.create({
            data: {
                token: code,
                userId: user.id,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
            }
        });

        // Send verification email
        try {
            await transporter.sendMail({
                from: `"AI Consultant" <${process.env.SMTP_USER}>`,
                to: email,
                subject: 'Подтверждение регистрации',
                html: `<p>Привет, ${name}!</p>
                       <p>Ваш код для подтверждения регистрации:</p>
                       <h2 style="color: #00604b; letter-spacing: 2px;">${code}</h2>`
            });
        } catch (emailError) {
            console.error('Failed to send email:', emailError);
            // Optionally, you might want to handle this gracefully
        }

        // We DO NOT auto login after register anymore. User must verify.
        res.status(201).json({ message: 'Registration successful. Please check your email for the verification code.', email });
    } catch (e) {
        console.error('Registration error:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Endpoint to verify email
router.post('/verify-email', async (req, res) => {
    try {
        const { email, code } = req.body;
        if (!email || !code) return res.status(400).json({ error: 'Email and code are required' });

        const db = prisma();
        const user = await db.user.findUnique({ where: { email } });
        if (!user) return res.status(400).json({ error: 'User not found' });

        const verificationToken = await db.verificationToken.findFirst({
            where: { userId: user.id, token: code }
        });

        if (!verificationToken) {
            return res.status(400).json({ error: 'Invalid verification code' });
        }

        if (verificationToken.expiresAt < new Date()) {
            await db.verificationToken.delete({ where: { id: verificationToken.id } });
            return res.status(400).json({ error: 'Code has expired' });
        }

        await db.user.update({
            where: { id: user.id },
            data: { isVerified: true }
        });

        await db.verificationToken.deleteMany({ where: { userId: user.id } });

        res.json({ message: 'Email verified successfully' });
    } catch (e) {
        console.error('Verification error:', e);
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

        if (!user.isVerified) {
            return res.status(403).json({ error: 'Please verify your email before logging in' });
        }

        req.session.userId = user.id;
        res.json({ user: { id: user.id, name: user.name, email: user.email, messagesRemaining: user.messagesRemaining, totalMessagesUsed: user.totalMessagesUsed, subscriptionPlan: user.subscriptionPlan } });
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
        res.json({ user: { id: user.id, name: user.name, email: user.email, messagesRemaining: user.messagesRemaining, totalMessagesUsed: user.totalMessagesUsed, subscriptionPlan: user.subscriptionPlan } });
    } catch (e) {
        console.error('Profile fetch error:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Google Authentication
router.post('/google', async (req, res) => {
    try {
        const { idToken } = req.body;
        if (!idToken) return res.status(400).json({ error: 'idToken is required' });

        console.log('[Google Auth] Received idToken, length:', idToken?.length);
        console.log('[Google Auth] Using GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);

        // Verify the Google token
        const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        
        const payload = ticket.getPayload();
        console.log('[Google Auth] Token verified! Email:', payload.email);
        const email = payload.email;
        const name = payload.name;
        const googleId = payload.sub;

        const db = prisma();
        let user = await db.user.findUnique({ where: { email } });

        if (!user) {
            user = await db.user.create({
                data: {
                    name,
                    email,
                    googleId,
                    isVerified: true,
                    messagesRemaining: 100,
                    messageTransactions: {
                        create: {
                            amount: 100,
                            type: 'bonus',
                            description: 'Welcome Bonus (Google)'
                        }
                    }
                }
            });
        } else if (!user.googleId) {
            user = await db.user.update({
                where: { email },
                data: { googleId, isVerified: true }
            });
        }

        req.session.userId = user.id;
        res.json({ user: { id: user.id, name: user.name, email: user.email, messagesRemaining: user.messagesRemaining, totalMessagesUsed: user.totalMessagesUsed, subscriptionPlan: user.subscriptionPlan } });
    } catch (e) {
        console.error('[Google Auth] FULL ERROR:', e.message);
        res.status(401).json({ error: `Google token error: ${e.message}` });
    }
});

export default router;
