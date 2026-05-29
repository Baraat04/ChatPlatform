import pkgPg from 'pg';
const { Pool } = pkgPg;
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const url = process.env.DATABASE_URL;
const pool = new Pool({ connectionString: url });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function check() {
  try {
    const bots = await prisma.bot.findMany();
    console.log('--- ALL BOTS ---');
    console.log(JSON.stringify(bots, null, 2));
    console.log('--- SYSTEM PROCESS ENV BASE_URL ---');
    console.log(process.env.BASE_URL);
    console.log('INSTAGRAM_VERIFY_TOKEN:', process.env.INSTAGRAM_VERIFY_TOKEN);
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}
check();
