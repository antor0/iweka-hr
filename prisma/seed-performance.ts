import "dotenv/config";
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('Starting Performance Management seed...');

    const admin = await prisma.user.findUnique({ where: { email: 'andiko@company.co.id' } });
    const employees = await prisma.employee.findMany();

    if (!admin || employees.length === 0) {
        console.log('Skipping seeder, no admin or employees found.');
        return;
    }

    // Create a Performance Cycle
    const cycle = await prisma.performanceCycle.create({
        data: {
            name: 'Mid-Year Review 2026',
            description: 'Mid-year performance check for all staff',
            startDate: new Date('2026-06-01'),
            endDate: new Date('2026-07-31'),
        }
    });

    // Pick a manager and a subordinate
    const manager = employees[0];
    const subordinate = employees.length > 1 ? employees[1] : employees[0];

    // Create an Appraisal
    const appraisal = await prisma.appraisal.create({
        data: {
            cycleId: cycle.id,
            employeeId: subordinate.id,
            managerId: manager.id,
            status: 'SELF_ASSESSMENT',
        }
    });

    // Create Goals
    await prisma.goal.create({
        data: {
            appraisalId: appraisal.id,
            title: 'Improve API Response Time',
            description: 'Optimize queries to hit < 200ms p95 latency',
            weight: 60,
            status: 'ON_TRACK',
            selfRating: 4
        }
    });

    await prisma.goal.create({
        data: {
            appraisalId: appraisal.id,
            title: 'Mentoring Junior Devs',
            description: 'Conduct at least 1 workshop per month',
            weight: 40,
            status: 'NOT_STARTED',
        }
    });

    console.log('Performance Management seeded successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
