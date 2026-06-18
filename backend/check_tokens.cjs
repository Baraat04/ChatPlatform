const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTokens() {
    const channels = await prisma.channel.findMany({ where: { platform: 'INSTAGRAM' } });
    console.log(`Found ${channels.length} Instagram channels in local DB.`);

    for (const channel of channels) {
        console.log(`\nChecking Channel ID: ${channel.id}, isActive: ${channel.isActive}`);
        if (!channel.apiToken) {
            console.log('No API Token');
            continue;
        }

        try {
            console.log(`Token starts with: ${channel.apiToken.substring(0, 15)}...`);
            const res = await fetch(`https://graph.facebook.com/v21.0/me?fields=instagram_business_account&access_token=${channel.apiToken}`);
            const data = await res.json();
            console.log('Meta API Response:', data);

            if (data.id) {
                // Check webhook subscriptions
                const subRes = await fetch(`https://graph.facebook.com/v21.0/${data.id}/subscribed_apps?access_token=${channel.apiToken}`);
                const subData = await subRes.json();
                console.log('Page Webhook Subscriptions:', JSON.stringify(subData, null, 2));
            }
        } catch (e) {
            console.error('Fetch error:', e);
        }
    }
    await prisma.$disconnect();
}
checkTokens();
