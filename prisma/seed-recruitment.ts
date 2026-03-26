import "dotenv/config";
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("Seeding Recruitment Data...");

    // Get an employee to be the requestor
    const requestor = await prisma.employee.findFirst();
    if (!requestor) throw new Error("No employees found. Seed main data first.");

    // Get departments and positions
    const departments = await prisma.department.findMany();
    const positions = await prisma.position.findMany();

    if (departments.length === 0 || positions.length === 0) {
        throw new Error("No departments or positions found.");
    }

    const existingCandidate = await prisma.candidate.findUnique({ where: { email: "john.doe@example.com" } });
    if (existingCandidate) {
        console.log("✅ Recruitment data already seeded. Skipping.");
        return;
    }

    // 1. Create Job Requisitions
    const req1 = await prisma.jobRequisition.create({
        data: {
            title: "Senior Backend Engineer",
            departmentId: departments[0].id,
            positionId: positions[0].id,
            headcount: 2,
            location: "Jakarta, Indonesia (Hybrid)",
            status: "OPEN",
            description: "We are looking for a Senior Backend Engineer to join our core team.",
            requirements: "- 5+ years of Node.js\n- Postgres Expert\n- English proficiency",
            requestedById: requestor.id,
            targetDate: new Date('2026-03-15')
        }
    });

    const req2 = await prisma.jobRequisition.create({
        data: {
            title: "HR Specialist",
            departmentId: departments[1].id,
            positionId: positions[1].id,
            headcount: 1,
            location: "Remote",
            status: "PENDING_APPROVAL",
            description: "HR generalist handling recruitment and onboarding.",
            requirements: "- 2+ years of HR experience\n- Psychology degree\n- Detail-oriented",
            requestedById: requestor.id,
        }
    });

    // 2. Create Candidates
    const cand1 = await prisma.candidate.create({
        data: {
            firstName: "John",
            lastName: "Doe",
            email: "john.doe@example.com",
            phone: "+628123456789",
            source: "LinkedIn",
        }
    });

    const cand2 = await prisma.candidate.create({
        data: {
            firstName: "Jane",
            lastName: "Smith",
            email: "jane.smith@example.com",
            phone: "+628987654321",
            source: "Careers Page",
        }
    });

    // 3. Create Applications
    const app1 = await prisma.application.create({
        data: {
            requisitionId: req1.id,
            candidateId: cand1.id,
            status: "SCREENING",
            expectedSalary: 25000000,
            notes: "Strong portfolio."
        }
    });

    const app2 = await prisma.application.create({
        data: {
            requisitionId: req1.id,
            candidateId: cand2.id,
            status: "NEW",
            expectedSalary: 20000000,
        }
    });

    console.log("✅ Seeded Requisitions, Candidates, and Applications.");
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
