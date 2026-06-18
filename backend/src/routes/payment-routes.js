import express from 'express';
import crypto from 'crypto';
import { prisma as getPrisma } from './bot-routes.js';

const router = express.Router();

const MERCHANT_LOGIN = process.env.ROBOKASSA_MERCHANT_LOGIN || 'up-chat.com';
const PASSWORD_1 = process.env.ROBOKASSA_PASSWORD_1 || '';
const PASSWORD_2 = process.env.ROBOKASSA_PASSWORD_2 || '';
const IS_TEST = process.env.ROBOKASSA_IS_TEST === 'true' ? 1 : 0;

// Generates payment link
router.post('/robokassa/pay', async (req, res) => {
    try {
        const { plan, userId } = req.body;
        
        let amount = 0;
        if (plan === 'STARTER') amount = 6990;
        else if (plan === 'GROWTH') amount = 15990;
        else if (plan === 'PRO') amount = 33990;
        else return res.status(400).json({ error: 'Invalid plan' });
        
        const amountStr = amount.toString();

        const invId = Math.floor(Date.now() / 1000) % 1000000000;

        // Custom parameters must start with shp_ and be sorted alphabetically
        const shp_plan = plan;
        const shp_user = userId;

        const customParams = `shp_plan=${shp_plan}:shp_user=${shp_user}`;
        const signatureString = `${MERCHANT_LOGIN}:${amountStr}:${invId}:${PASSWORD_1}:${customParams}`;
        
        const signature = crypto.createHash('md5').update(signatureString).digest('hex');

        const paymentUrl = `https://auth.robokassa.kz/Merchant/Index.aspx?MerchantLogin=${MERCHANT_LOGIN}&OutSum=${amountStr}&InvId=${invId}&Description=${encodeURIComponent('Подписка UP-CHAT ' + plan)}&SignatureValue=${signature}&shp_plan=${shp_plan}&shp_user=${shp_user}&IsTest=${IS_TEST}`;

        res.json({ paymentUrl });
    } catch (e) {
        console.error('Robokassa pay error:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Result URL (Webhook) - Robokassa sends POST request here
router.post('/robokassa/webhook', async (req, res) => {
    try {
        // Robokassa might send parameters via POST (x-www-form-urlencoded) or GET
        const params = req.method === 'POST' ? req.body : req.query;
        const { OutSum, InvId, SignatureValue, shp_plan, shp_user } = params;

        // Signature validation for Result URL uses PASSWORD_2
        const signatureString = `${OutSum}:${InvId}:${PASSWORD_2}:shp_plan=${shp_plan}:shp_user=${shp_user}`;
        const expectedSignature = crypto.createHash('md5').update(signatureString).digest('hex').toUpperCase();

        if (!SignatureValue || SignatureValue.toUpperCase() !== expectedSignature) {
            console.error('Robokassa bad signature:', { received: SignatureValue, expected: expectedSignature });
            return res.status(400).send('Bad signature');
        }

        // Update user subscription
        let messageLimit = 100;
        if (shp_plan === 'STARTER') messageLimit = 1000;
        else if (shp_plan === 'GROWTH') messageLimit = 6000;
        else if (shp_plan === 'PRO') messageLimit = 15000;

        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1);

        const db = getPrisma();
        await db.user.update({
            where: { id: shp_user },
            data: {
                subscriptionPlan: shp_plan,
                messageLimit,
                subscriptionExpiresAt: expiresAt
            }
        });

        // Always respond with OK<InvId> to confirm receipt
        res.send(`OK${InvId}`);
    } catch (e) {
        console.error('Robokassa webhook error:', e);
        res.status(500).send('Error');
    }
});

// Success URL (Robokassa redirects user here after payment)
router.get('/robokassa/success', (req, res) => {
    res.redirect(`${process.env.FRONTEND_URL || 'https://up-chat.com'}/profile?payment=success`);
});

// Fail URL (Robokassa redirects user here after failed payment)
router.get('/robokassa/fail', (req, res) => {
    res.redirect(`${process.env.FRONTEND_URL || 'https://up-chat.com'}/profile?payment=fail`);
});

export default router;
