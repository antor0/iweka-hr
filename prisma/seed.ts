import "dotenv/config";
import { PrismaClient, Gender, MaritalStatus, EmploymentStatus, EmploymentType, UserRole, ComponentType, CalculationType, TaxMethod } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🌱 Starting seed...');

    // 1. Create Base Departments
    const hrdDept = await prisma.department.upsert({
        where: { code: 'D-HRD' },
        update: {},
        create: { name: 'Human Resources', code: 'D-HRD' },
    });

    const financeDept = await prisma.department.upsert({
        where: { code: 'D-FIN' },
        update: {},
        create: { name: 'Finance', code: 'D-FIN' },
    });

    const itDept = await prisma.department.upsert({
        where: { code: 'D-IT' },
        update: {},
        create: { name: 'IT & Technology', code: 'D-IT' },
    });

    const opsDept = await prisma.department.upsert({
        where: { code: 'D-OPS' },
        update: {},
        create: { name: 'Operations', code: 'D-OPS' },
    });

    console.log('✅ Departments created');

    // 2. Create Grades
    const grades = [
        { level: 1, name: 'Grade I', minSalary: 4500000, maxSalary: 6000000 },
        { level: 2, name: 'Grade II', minSalary: 6000000, maxSalary: 8000000 },
        { level: 3, name: 'Grade III', minSalary: 8000000, maxSalary: 12000000 },
        { level: 4, name: 'Grade IV', minSalary: 12000000, maxSalary: 18000000 },
        { level: 5, name: 'Grade V', minSalary: 18000000, maxSalary: 25000000 },
        { level: 6, name: 'Grade VI', minSalary: 25000000, maxSalary: 40000000 },
    ];

    for (const g of grades) {
        await prisma.grade.upsert({
            where: { level: g.level },
            update: {},
            create: g,
        });
    }

    const gradeVI = await prisma.grade.findUnique({ where: { level: 6 } });

    console.log('✅ Grades created');

    // 3. Create Positions
    const hrManagerPos = await prisma.position.upsert({
        where: { code: 'P-HRM' },
        update: {},
        create: { title: 'HR Manager', code: 'P-HRM', departmentId: hrdDept.id, gradeId: gradeVI?.id },
    });

    const sysAdminPos = await prisma.position.upsert({
        where: { code: 'P-SYS' },
        update: {},
        create: { title: 'System Administrator', code: 'P-SYS', departmentId: itDept.id, gradeId: gradeVI?.id },
    });

    console.log('✅ Positions created');

    // 4. Create Admin Employee and User
    // Set default PIN for ESS access
    const defaultPinHash = await bcrypt.hash('123456', 10);

    // Simulate Andiko Wibisana as HR Admin/Manager
    const adminEmployee = await prisma.employee.upsert({
        where: { employeeNumber: 'EMP-0001' },
        update: {},
        create: {
            employeeNumber: 'EMP-0001',
            nik: '3271000000000001',
            fullName: 'Andiko Wibisana',
            email: 'andiko@company.co.id',
            phone: '081234567890',
            dateOfBirth: new Date('1990-03-15'),
            gender: Gender.MALE,
            maritalStatus: MaritalStatus.K_2,
            npwp: '01.234.567.8-012.345',
            hireDate: new Date('2020-03-15'),
            employmentStatus: EmploymentStatus.ACTIVE,
            employmentType: EmploymentType.PERMANENT,
            departmentId: hrdDept.id,
            positionId: hrManagerPos.id,
            gradeId: gradeVI?.id,
            pin: defaultPinHash,
            pinMustChange: true,
        },
    });

    // Assign Head of HRD department to this employee
    await prisma.department.update({
        where: { id: hrdDept.id },
        data: { headId: adminEmployee.id },
    });

    // Create User account — look up by employeeId first to avoid unique constraint on employee_id
    const existingUserByEmployee = await prisma.user.findUnique({ where: { employeeId: adminEmployee.id } });
    if (existingUserByEmployee) {
        // Already exists linked to this employee — just update role/email if needed
        await prisma.user.update({
            where: { id: existingUserByEmployee.id },
            data: { email: 'andiko@company.co.id', role: UserRole.SYSTEM_ADMIN },
        });
    } else {
        // No user linked to this employee yet — upsert by email (safe: employee_id is free)
        await prisma.user.upsert({
            where: { email: 'andiko@company.co.id' },
            update: { employeeId: adminEmployee.id, role: UserRole.SYSTEM_ADMIN },
            create: {
                email: 'andiko@company.co.id',
                passwordHash: '$2b$10$A5D1...', // normally hashed, this is dummy seed
                employeeId: adminEmployee.id,
                role: UserRole.SYSTEM_ADMIN,
            },
        });
    }

    console.log('✅ Admin Employee & User created');

    // 5. Create Leave Types
    const leaveTypes = [
        { code: 'LV-ANNUAL', name: 'Annual Leave', annualEntitlement: 12, isCarryOver: true, maxCarryOverDays: 6 },
        { code: 'LV-SICK', name: 'Sick Leave', annualEntitlement: 999, requiresAttachment: true },
        { code: 'LV-MATERNITY', name: 'Maternity Leave', annualEntitlement: 90 },
        { code: 'LV-MARRIAGE', name: 'Marriage Leave', annualEntitlement: 3 },
    ];

    for (const lt of leaveTypes) {
        await prisma.leaveType.upsert({
            where: { code: lt.code },
            update: {},
            create: lt,
        });
    }
    console.log('✅ Leave types created');

    // 6. Create Salary Components
    await prisma.salaryComponent.upsert({
        where: { code: 'BASIC' },
        update: {},
        create: { name: 'Basic Salary', code: 'BASIC', type: ComponentType.EARNING, calculationType: CalculationType.FIXED, isTaxable: true, isBpjsBase: true },
    });

    await prisma.salaryComponent.upsert({
        where: { code: 'ALLOW_TRANS' },
        update: {},
        create: { name: 'Transport Allowance', code: 'ALLOW_TRANS', type: ComponentType.EARNING, calculationType: CalculationType.FIXED, isTaxable: true, isBpjsBase: false },
    });

    console.log('✅ Salary components created');

    // 7. Create BPJS Config (skip if already exists)
    const existingBpjs = await prisma.bpjsConfig.findFirst({
        where: { effectiveDate: new Date('2024-01-01') },
    });
    if (!existingBpjs) {
        await prisma.bpjsConfig.create({
            data: {
                effectiveDate: new Date('2024-01-01'),
                kesEmployeeRate: 0.0100,
                kesCompanyRate: 0.0400,
                kesSalaryCap: 12000000,
                jhtEmployeeRate: 0.0200,
                jhtCompanyRate: 0.0370,
                jkkCompanyRate: 0.0054, // Tingkat risiko 2
                jkmCompanyRate: 0.0030,
                jpEmployeeRate: 0.0100,
                jpCompanyRate: 0.0200,
                jpSalaryCap: 10042300,
            }
        });
    }

    // 8. Create Tax Config (TER Method 2024+) — skip if already exists
    const existingTax = await prisma.taxConfig.findFirst({
        where: { effectiveDate: new Date('2024-01-01') },
    });
    if (!existingTax) {
        await prisma.taxConfig.create({
            data: {
                effectiveDate: new Date('2024-01-01'),
                method: TaxMethod.TER,
                brackets: [
                    { max: 60000000, rate: 0.05 },
                    { max: 250000000, rate: 0.15 },
                    { max: 500000000, rate: 0.25 },
                    { max: 5000000000, rate: 0.30 },
                    { max: null, rate: 0.35 }
                ],
                ptkpValues: {
                    "TK_0": 54000000,
                    "TK_1": 58500000,
                    "TK_2": 63000000,
                    "TK_3": 67500000,
                    "K_0": 58500000,
                    "K_1": 63000000,
                    "K_2": 67500000,
                    "K_3": 72000000
                },
                terRates: {
                    "A": [ // For TK_0, TK_1, K_0
                        { min: 0, max: 5400000, rate: 0.0 },
                        { min: 5400001, max: 5650000, rate: 0.0025 },
                        { min: 5650001, max: 5950000, rate: 0.005 },
                        // ... truncated for brevity
                    ],
                    "B": [], // K_1, K_2, TK_2, TK_3
                    "C": []  // K_3
                }
            }
        });
    }

    console.log('✅ Configuration created (BPJS & PPh21)');
    console.log('🌱 Seeding completed successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
