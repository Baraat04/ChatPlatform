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

// Instagram OAuth Redirect Initializer
router.get('/instagram/connect', (req, res) => {
    const botId = req.query.botId;
    if (!botId) {
        return res.status(400).json({ error: 'botId query parameter is required' });
    }
    const clientId = process.env.INSTAGRAM_CLIENT_ID;
    const redirectUri = process.env.INSTAGRAM_REDIRECT_URI || 'https://api.up-chat.com/auth/instagram/callback';
    const scope = 'instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments';
    
    if (!clientId) {
        console.error('[Instagram OAuth] Error: INSTAGRAM_CLIENT_ID environment variable is missing.');
        return res.status(500).send('Instagram Client ID is not configured on the server.');
    }

    const authorizeUrl = `https://www.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&state=${botId}`;
    return res.redirect(authorizeUrl);
});

// Instagram OAuth Callback
router.get('/instagram/callback', async (req, res) => {
    try {
        const { code, state, error, error_reason, error_description } = req.query;
        
        if (error) {
            console.error('[Instagram OAuth] Error:', error, error_description);
            return res.redirect(`https://up-chat.com/bots/${state}?instagram_error=${encodeURIComponent(error_description || error)}`);
        }
        
        if (!code || !state) {
            return res.redirect(`https://up-chat.com?instagram_error=Missing_code_or_state`);
        }

        const botId = Number(state);
        if (isNaN(botId)) {
            return res.redirect(`https://up-chat.com?instagram_error=Invalid_bot_id`);
        }

        const clientId = process.env.INSTAGRAM_CLIENT_ID;
        const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;
        const redirectUri = process.env.INSTAGRAM_REDIRECT_URI || 'https://api.up-chat.com/auth/instagram/callback';

        const tokenForm = new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri,
            code: code,
        });

        const shortTokenRes = await fetch('https://api.instagram.com/oauth/access_token', {
            method: 'POST',
            body: tokenForm
        });

        const shortTokenData = await shortTokenRes.json();
        
        if (!shortTokenRes.ok || !shortTokenData.access_token) {
            console.error('[Instagram OAuth] Short token error:', shortTokenData);
            return res.redirect(`https://up-chat.com/bots/${botId}?instagram_error=${encodeURIComponent('Failed to get access token')}`);
        }

        const longTokenUrl = `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${clientSecret}&access_token=${shortTokenData.access_token}`;
        const longTokenRes = await fetch(longTokenUrl);
        const longTokenData = await longTokenRes.json();

        if (!longTokenRes.ok || !longTokenData.access_token) {
            console.error('[Instagram OAuth] Long token error:', longTokenData);
            return res.redirect(`https://up-chat.com/bots/${botId}?instagram_error=${encodeURIComponent('Failed to get long-lived token')}`);
        }

        const longToken = longTokenData.access_token;
        const expiresIn = longTokenData.expires_in || (60 * 24 * 60 * 60); // default 60 days
        const expiresAt = new Date(Date.now() + expiresIn * 1000);
        const instagramUserId = shortTokenData.user_id?.toString() || '';

        const db = prisma();
        
        let channel = await db.channel.findFirst({
            where: { botId, platform: 'INSTAGRAM' }
        });

        if (channel) {
            await db.channel.update({
                where: { id: channel.id },
                data: {
                    apiToken: longToken,
                    instagramUserId: instagramUserId,
                    tokenExpiresAt: expiresAt,
                    isActive: true
                }
            });
        } else {
            await db.channel.create({
                data: {
                    botId,
                    platform: 'INSTAGRAM',
                    apiToken: longToken,
                    instagramUserId: instagramUserId,
                    tokenExpiresAt: expiresAt,
                    isActive: true,
                    slug: `ch-${botId}-instagram-${Date.now()}`
                }
            });
        }
        
        await db.bot.update({
            where: { id: botId },
            data: {
                instagramUserId: instagramUserId,
                tokenExpiresAt: expiresAt
            }
        });

        // Try to auto-subscribe the webhook
        try {
            console.log('[Instagram OAuth] Attempting auto-subscription for token...');
            let subRes = await fetch(`https://graph.instagram.com/v21.0/me/subscribed_apps?subscribed_fields=messages,comments,messaging_postbacks&access_token=${longToken}`, {
                method: 'POST'
            });
            let subData = await subRes.json();
            console.log('[Instagram OAuth] graph.instagram.com subscribed_apps result:', JSON.stringify(subData));

            if (!subData.success) {
                const meRes = await fetch(`https://graph.facebook.com/v21.0/me?access_token=${longToken}`);
                const meData = await meRes.json();
                if (meData.id && !meData.error) {
                    const fbSubRes = await fetch(`https://graph.facebook.com/v21.0/${meData.id}/subscribed_apps`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            subscribed_fields: ['messages', 'messaging_postbacks'],
                            access_token: longToken
                        })
                    });
                    const fbSubData = await fbSubRes.json();
                    console.log('[Instagram OAuth] graph.facebook.com subscribed_apps result:', JSON.stringify(fbSubData));
                }
            }
        } catch (subErr) {
            console.error('[Instagram OAuth] Webhook auto-subscribe error:', subErr.message);
        }

        return res.redirect(`https://up-chat.com/bots/${botId}?instagram_connected=1`);

    } catch (e) {
        console.error('[Instagram OAuth] Full Error:', e);
        const botId = req.query.state ? Number(req.query.state) : '';
        return res.redirect(`https://up-chat.com/bots/${botId}?instagram_error=Internal_Error`);
    }
});

export default router;
