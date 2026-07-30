import { getPrisma } from './src/utils/db.js';
async function main() {
    const prisma = getPrisma();
    const channels = await prisma.channel.findMany({ where: { platform: 'WHATSAPP' } });
    console.log(channels);
}
main();
