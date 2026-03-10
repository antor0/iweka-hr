import "dotenv/config";
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const passwordHash = await bcrypt.hash('Password123!', 10);
    await prisma.user.update({
        where: { email: 'wisesa@company.co.id' },
        data: { passwordHash }
    });
    console.log('Admin password updated to Password123!');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
