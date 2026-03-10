import "dotenv/config";
import {
    PrismaClient, Gender, MaritalStatus, EmploymentStatus, EmploymentType,
    UserRole, AttendanceStatus, AttendanceSource, RequestStatus,
    PayrollStatus, AppraisalStatus, EmployeeChangeType,
    RequisitionStatus, ApplicationStatus
} from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ── Employee definitions ──
const employeeDefs = [
    { num: 'EMP-0002', nik: '3271000000000002', name: 'Rina Puspitasari', email: 'rina@company.co.id', phone: '081234567891', dob: '1992-07-22', gender: Gender.FEMALE, marital: MaritalStatus.K_1, npwp: '02.345.678.9-012.345', hire: '2021-01-10', dept: 'D-HRD', pos: 'P-HRM', grade: 4, role: UserRole.HR_ADMIN },
    { num: 'EMP-0003', nik: '3271000000000003', name: 'Budi Santoso', email: 'budi@company.co.id', phone: '081234567892', dob: '1988-11-05', gender: Gender.MALE, marital: MaritalStatus.K_2, npwp: '03.456.789.0-012.345', hire: '2019-06-01', dept: 'D-IT', pos: 'P-SYS', grade: 5, role: UserRole.LINE_MANAGER },
    { num: 'EMP-0004', nik: '3271000000000004', name: 'Dewi Kartika', email: 'dewi@company.co.id', phone: '081234567893', dob: '1995-03-18', gender: Gender.FEMALE, marital: MaritalStatus.TK_0, npwp: '04.567.890.1-012.345', hire: '2022-08-15', dept: 'D-FIN', pos: null, grade: 3 },
    { num: 'EMP-0005', nik: '3271000000000005', name: 'Ahmad Fauzi', email: 'ahmad@company.co.id', phone: '081234567894', dob: '1991-09-30', gender: Gender.MALE, marital: MaritalStatus.K_0, npwp: '05.678.901.2-012.345', hire: '2020-02-20', dept: 'D-OPS', pos: null, grade: 4 },
    { num: 'EMP-0006', nik: '3271000000000006', name: 'Sri Wahyuni', email: 'sri@company.co.id', phone: '081234567895', dob: '1993-12-01', gender: Gender.FEMALE, marital: MaritalStatus.K_1, npwp: '06.789.012.3-012.345', hire: '2021-05-10', dept: 'D-FIN', pos: null, grade: 3 },
    { num: 'EMP-0007', nik: '3271000000000007', name: 'Rizki Pratama', email: 'rizki@company.co.id', phone: '081234567896', dob: '1997-01-25', gender: Gender.MALE, marital: MaritalStatus.TK_0, npwp: '07.890.123.4-012.345', hire: '2023-03-01', dept: 'D-IT', pos: null, grade: 2 },
    { num: 'EMP-0008', nik: '3271000000000008', name: 'Nurul Hidayah', email: 'nurul@company.co.id', phone: '081234567897', dob: '1994-06-14', gender: Gender.FEMALE, marital: MaritalStatus.TK_1, npwp: '08.901.234.5-012.345', hire: '2022-01-15', dept: 'D-HRD', pos: null, grade: 2 },
    { num: 'EMP-0009', nik: '3271000000000009', name: 'Hendra Wijaya', email: 'hendra@company.co.id', phone: '081234567898', dob: '1990-04-08', gender: Gender.MALE, marital: MaritalStatus.K_3, npwp: '09.012.345.6-012.345', hire: '2018-09-01', dept: 'D-OPS', pos: null, grade: 5, role: UserRole.LINE_MANAGER },
    { num: 'EMP-0010', nik: '3271000000000010', name: 'Siti Aminah', email: 'siti@company.co.id', phone: '081234567899', dob: '1996-08-20', gender: Gender.FEMALE, marital: MaritalStatus.K_0, npwp: '10.123.456.7-012.345', hire: '2023-07-01', dept: 'D-IT', pos: null, grade: 1 },
    { num: 'EMP-0011', nik: '3271000000000011', name: 'Yoga Aditya', email: 'yoga@company.co.id', phone: '081234567900', dob: '1998-02-14', gender: Gender.MALE, marital: MaritalStatus.TK_0, npwp: '11.234.567.8-012.345', hire: '2024-01-15', dept: 'D-IT', pos: null, grade: 1 },
    { num: 'EMP-0012', nik: '3271000000000012', name: 'Mega Lestari', email: 'mega@company.co.id', phone: '081234567901', dob: '1989-10-10', gender: Gender.FEMALE, marital: MaritalStatus.K_2, npwp: '12.345.678.9-012.345', hire: '2020-11-01', dept: 'D-FIN', pos: null, grade: 4, role: UserRole.LINE_MANAGER },
    { num: 'EMP-0013', nik: '3271000000000013', name: 'Fajar Ramadhan', email: 'fajar@company.co.id', phone: '081234567902', dob: '1999-05-17', gender: Gender.MALE, marital: MaritalStatus.TK_0, npwp: '13.456.789.0-012.345', hire: '2024-06-01', dept: 'D-OPS', pos: null, grade: 1 },
    { num: 'EMP-0014', nik: '3271000000000014', name: 'Putri Handayani', email: 'putri@company.co.id', phone: '081234567903', dob: '1993-07-28', gender: Gender.FEMALE, marital: MaritalStatus.TK_0, npwp: '14.567.890.1-012.345', hire: '2022-04-10', dept: 'D-OPS', pos: null, grade: 2 },
    { num: 'EMP-0015', nik: '3271000000000015', name: 'Dimas Prasetyo', email: 'dimas@company.co.id', phone: '081234567904', dob: '1987-12-03', gender: Gender.MALE, marital: MaritalStatus.K_1, npwp: '15.678.901.2-012.345', hire: '2019-01-02', dept: 'D-IT', pos: null, grade: 3, status: EmploymentStatus.PROBATION },
];

// ── Additional positions ──
const extraPositions = [
    { code: 'P-ACC', title: 'Accountant', dept: 'D-FIN', grade: 3 },
    { code: 'P-DEV', title: 'Software Developer', dept: 'D-IT', grade: 2 },
    { code: 'P-OPM', title: 'Operations Manager', dept: 'D-OPS', grade: 5 },
    { code: 'P-HRS', title: 'HR Specialist', dept: 'D-HRD', grade: 2 },
    { code: 'P-FAM', title: 'Finance Manager', dept: 'D-FIN', grade: 4 },
    { code: 'P-OPS', title: 'Operations Staff', dept: 'D-OPS', grade: 1 },
    { code: 'P-SDE', title: 'Senior Developer', dept: 'D-IT', grade: 3 },
    { code: 'P-JDE', title: 'Junior Developer', dept: 'D-IT', grade: 1 },
];

// Position assignments by employee number
const positionMap: Record<string, string> = {
    'EMP-0004': 'P-ACC', 'EMP-0005': 'P-OPM', 'EMP-0006': 'P-ACC',
    'EMP-0007': 'P-DEV', 'EMP-0008': 'P-HRS', 'EMP-0009': 'P-OPM',
    'EMP-0010': 'P-JDE', 'EMP-0011': 'P-JDE', 'EMP-0012': 'P-FAM',
    'EMP-0013': 'P-OPS', 'EMP-0014': 'P-OPS', 'EMP-0015': 'P-SDE',
};

// ── Main function ──
async function main() {
    console.log('🌱 Starting comprehensive sample data seed...\n');

    // ── Lookup existing reference data ──
    const departments = await prisma.department.findMany();
    const grades = await prisma.grade.findMany();
    const leaveTypes = await prisma.leaveType.findMany();
    const taxConfig = await prisma.taxConfig.findFirst({ where: { isActive: true } });
    const bpjsConfig = await prisma.bpjsConfig.findFirst({ where: { isActive: true } });
    const adminEmployee = await prisma.employee.findUnique({ where: { employeeNumber: 'EMP-0001' } });
    const adminUser = await prisma.user.findUnique({ where: { email: 'wisesa@company.co.id' } });

    if (!adminEmployee || !adminUser || departments.length === 0 || grades.length === 0) {
        throw new Error('❌ Base seed data not found. Run `npx prisma db seed` first.');
    }

    const deptMap = Object.fromEntries(departments.map(d => [d.code, d]));
    const gradeMap = Object.fromEntries(grades.map(g => [g.level, g]));

    // ── 1. Create additional positions ──
    console.log('📋 Creating positions...');
    const posMap: Record<string, string> = {};
    for (const p of extraPositions) {
        const pos = await prisma.position.upsert({
            where: { code: p.code },
            update: {},
            create: { title: p.title, code: p.code, departmentId: deptMap[p.dept]?.id, gradeId: gradeMap[p.grade]?.id },
        });
        posMap[p.code] = pos.id;
    }
    // Also store existing positions
    const existingPositions = await prisma.position.findMany();
    for (const p of existingPositions) { posMap[p.code] = p.id; }
    console.log('  ✅ Positions created');

    // ── 2. Create employees ──
    console.log('👥 Creating employees...');
    const passwordHash = await bcrypt.hash('Password123!', 10);
    const employeeIds: Record<string, string> = { 'EMP-0001': adminEmployee.id };

    for (const e of employeeDefs) {
        const posCode = e.pos || positionMap[e.num];
        const emp = await prisma.employee.upsert({
            where: { employeeNumber: e.num },
            update: {},
            create: {
                employeeNumber: e.num, nik: e.nik, fullName: e.name, email: e.email,
                phone: e.phone, dateOfBirth: new Date(e.dob), gender: e.gender,
                maritalStatus: e.marital, npwp: e.npwp, hireDate: new Date(e.hire),
                employmentStatus: (e as any).status || EmploymentStatus.ACTIVE,
                employmentType: EmploymentType.PERMANENT,
                departmentId: deptMap[e.dept]?.id, positionId: posCode ? posMap[posCode] : undefined,
                gradeId: gradeMap[e.grade]?.id,
                bankName: ['BCA', 'BRI', 'Mandiri', 'BNI'][Math.floor(Math.random() * 4)],
                bankAccount: `${1000000000 + parseInt(e.num.replace('EMP-', ''))}`,
                managerId: e.dept === 'D-IT' ? undefined : adminEmployee.id,
            },
        });
        employeeIds[e.num] = emp.id;

        // Create user account for employees with roles
        if (e.role) {
            await prisma.user.upsert({
                where: { email: e.email },
                update: {},
                create: { email: e.email, passwordHash, employeeId: emp.id, role: e.role },
            });
        }
    }

    // Set managers: IT employees -> Budi, OPS employees -> Hendra, FIN employees -> Mega
    const managerAssignments: Record<string, string> = {
        'D-IT': employeeIds['EMP-0003'],
        'D-OPS': employeeIds['EMP-0009'],
        'D-FIN': employeeIds['EMP-0012'],
    };
    for (const e of employeeDefs) {
        const mgr = managerAssignments[e.dept];
        if (mgr && employeeIds[e.num] !== mgr) {
            await prisma.employee.update({ where: { id: employeeIds[e.num] }, data: { managerId: mgr } });
        }
    }

    // Set department heads
    await prisma.department.update({ where: { code: 'D-IT' }, data: { headId: employeeIds['EMP-0003'] } });
    await prisma.department.update({ where: { code: 'D-OPS' }, data: { headId: employeeIds['EMP-0009'] } });
    await prisma.department.update({ where: { code: 'D-FIN' }, data: { headId: employeeIds['EMP-0012'] } });

    console.log('  ✅ 15 employees + user accounts created');

    // ── 3. Family members ──
    console.log('👨‍👩‍👧‍👦 Creating family members...');
    const families = [
        { emp: 'EMP-0001', rel: 'SPOUSE' as const, name: 'Kartini Widyantoro', dob: '1992-05-20' },
        { emp: 'EMP-0001', rel: 'CHILD' as const, name: 'Arya Widyantoro', dob: '2020-08-15' },
        { emp: 'EMP-0001', rel: 'CHILD' as const, name: 'Sari Widyantoro', dob: '2023-01-10' },
        { emp: 'EMP-0003', rel: 'SPOUSE' as const, name: 'Lina Santoso', dob: '1990-03-12' },
        { emp: 'EMP-0003', rel: 'CHILD' as const, name: 'Raka Santoso', dob: '2019-06-20' },
        { emp: 'EMP-0009', rel: 'SPOUSE' as const, name: 'Maya Wijaya', dob: '1992-11-08' },
        { emp: 'EMP-0009', rel: 'CHILD' as const, name: 'Kenzo Wijaya', dob: '2018-02-14' },
        { emp: 'EMP-0009', rel: 'CHILD' as const, name: 'Keiko Wijaya', dob: '2020-09-30' },
        { emp: 'EMP-0009', rel: 'CHILD' as const, name: 'Kayla Wijaya', dob: '2023-04-01' },
        { emp: 'EMP-0012', rel: 'SPOUSE' as const, name: 'Andi Lestari', dob: '1988-07-15' },
        { emp: 'EMP-0012', rel: 'CHILD' as const, name: 'Dara Lestari', dob: '2017-12-25' },
    ];
    for (const f of families) {
        await prisma.familyMember.create({
            data: {
                employeeId: employeeIds[f.emp], relationship: f.rel,
                fullName: f.name, dateOfBirth: new Date(f.dob),
                isBpjsDependent: true,
            },
        });
    }
    console.log('  ✅ Family members created');

    // ── 4. Shifts ──
    console.log('⏰ Creating shifts...');
    await prisma.shift.create({ data: { name: 'Regular Office', startTime: '08:00', endTime: '17:00', breakMinutes: 60, isDefault: true } });
    await prisma.shift.create({ data: { name: 'Night Shift', startTime: '20:00', endTime: '05:00', breakMinutes: 60, isDefault: false } });
    console.log('  ✅ Shifts created');

    // ── 5. Attendance records (Feb 2026) ──
    console.log('📊 Creating attendance records...');
    const allEmpNums = ['EMP-0001', ...employeeDefs.map(e => e.num)];
    for (let day = 1; day <= 25; day++) {
        const dayOfWeek = new Date(2026, 1, day).getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Skip weekends

        for (const empNum of allEmpNums) {
            const rand = Math.random();
            let status: AttendanceStatus = AttendanceStatus.PRESENT;
            let clockIn: Date | null = new Date(2026, 1, day, 7, 50 + Math.floor(Math.random() * 15));
            let clockOut: Date | null = new Date(2026, 1, day, 17, Math.floor(Math.random() * 30));
            let workHours = 8;
            let overtime = 0;

            if (rand > 0.92) { status = AttendanceStatus.ABSENT; clockIn = null; clockOut = null; workHours = 0; }
            else if (rand > 0.82) { status = AttendanceStatus.LATE; clockIn = new Date(2026, 1, day, 8, 15 + Math.floor(Math.random() * 45)); workHours = 7; }
            else if (rand > 0.75) { overtime = 1 + Math.floor(Math.random() * 3); clockOut = new Date(2026, 1, day, 18 + overtime, 0); workHours = 8 + overtime; }

            try {
                await prisma.attendance.create({
                    data: {
                        employeeId: employeeIds[empNum],
                        date: new Date(2026, 1, day),
                        clockIn, clockOut,
                        status,
                        workHours: workHours || null,
                        overtimeHours: overtime || null,
                        source: AttendanceSource.WEB,
                        notes: status === AttendanceStatus.ABSENT ? 'Sakit / Izin' : null,
                    },
                });
            } catch { /* skip duplicates */ }
        }
    }
    console.log('  ✅ Attendance records created');

    // ── 6. Overtime requests ──
    console.log('🕐 Creating overtime requests...');
    const otRequests = [
        { emp: 'EMP-0003', date: '2026-02-10', planned: 3, actual: 2.5, status: RequestStatus.APPROVED, approver: 'EMP-0001' },
        { emp: 'EMP-0007', date: '2026-02-12', planned: 2, actual: 2, status: RequestStatus.APPROVED, approver: 'EMP-0003' },
        { emp: 'EMP-0005', date: '2026-02-15', planned: 4, actual: null, status: RequestStatus.PENDING, approver: null },
        { emp: 'EMP-0014', date: '2026-02-18', planned: 2, actual: null, status: RequestStatus.PENDING, approver: null },
        { emp: 'EMP-0010', date: '2026-02-20', planned: 3, actual: null, status: RequestStatus.REJECTED, approver: 'EMP-0003' },
        { emp: 'EMP-0006', date: '2026-02-08', planned: 2, actual: 2, status: RequestStatus.APPROVED, approver: 'EMP-0012' },
    ];
    for (const ot of otRequests) {
        await prisma.overtimeRequest.create({
            data: {
                employeeId: employeeIds[ot.emp], date: new Date(ot.date),
                plannedHours: ot.planned, actualHours: ot.actual, reason: 'Project deadline / urgent task',
                status: ot.status, approvedById: ot.approver ? employeeIds[ot.approver] : null,
            },
        });
    }
    console.log('  ✅ Overtime requests created');

    // ── 7. Leave balances & requests ──
    console.log('🏖️ Creating leave balances & requests...');
    for (const empNum of allEmpNums) {
        for (const lt of leaveTypes) {
            try {
                await prisma.leaveBalance.create({
                    data: {
                        employeeId: employeeIds[empNum], leaveTypeId: lt.id,
                        year: 2026, entitlement: lt.annualEntitlement,
                        used: Math.floor(Math.random() * 3), carryOver: lt.code === 'LV-ANNUAL' ? Math.floor(Math.random() * 4) : 0,
                    },
                });
            } catch { /* skip duplicates */ }
        }
    }

    const annualLeave = leaveTypes.find(lt => lt.code === 'LV-ANNUAL');
    const sickLeave = leaveTypes.find(lt => lt.code === 'LV-SICK');
    if (annualLeave && sickLeave) {
        const leaveReqs = [
            { emp: 'EMP-0002', type: annualLeave.id, start: '2026-02-10', end: '2026-02-12', days: 3, status: RequestStatus.APPROVED, approver: 'EMP-0001', reason: 'Family vacation' },
            { emp: 'EMP-0004', type: annualLeave.id, start: '2026-02-17', end: '2026-02-18', days: 2, status: RequestStatus.APPROVED, approver: 'EMP-0012', reason: 'Personal matters' },
            { emp: 'EMP-0007', type: sickLeave.id, start: '2026-02-05', end: '2026-02-05', days: 1, status: RequestStatus.APPROVED, approver: 'EMP-0003', reason: 'Flu / fever' },
            { emp: 'EMP-0010', type: annualLeave.id, start: '2026-03-01', end: '2026-03-03', days: 3, status: RequestStatus.PENDING, approver: null, reason: 'Wedding attendance' },
            { emp: 'EMP-0013', type: annualLeave.id, start: '2026-03-10', end: '2026-03-14', days: 5, status: RequestStatus.PENDING, approver: null, reason: 'Mudik lebaran' },
            { emp: 'EMP-0005', type: sickLeave.id, start: '2026-01-20', end: '2026-01-21', days: 2, status: RequestStatus.APPROVED, approver: 'EMP-0009', reason: 'Medical check-up' },
            { emp: 'EMP-0011', type: annualLeave.id, start: '2026-02-24', end: '2026-02-25', days: 2, status: RequestStatus.REJECTED, approver: 'EMP-0003', reason: 'Travel plans' },
            { emp: 'EMP-0014', type: sickLeave.id, start: '2026-02-03', end: '2026-02-03', days: 1, status: RequestStatus.APPROVED, approver: 'EMP-0009', reason: 'Dental appointment' },
        ];
        for (const lr of leaveReqs) {
            await prisma.leaveRequest.create({
                data: {
                    employeeId: employeeIds[lr.emp], leaveTypeId: lr.type,
                    startDate: new Date(lr.start), endDate: new Date(lr.end),
                    totalDays: lr.days, reason: lr.reason, status: lr.status,
                    approvedById: lr.approver ? employeeIds[lr.approver] : null,
                },
            });
        }
    }
    console.log('  ✅ Leave balances & requests created');

    // ── 8. Payroll runs (Jan & Feb 2026) ──
    console.log('💰 Creating payroll runs...');
    const salaryByGrade: Record<number, number> = { 1: 5000000, 2: 7000000, 3: 10000000, 4: 15000000, 5: 20000000, 6: 30000000 };

    for (const [month, status] of [[1, PayrollStatus.FINALIZED], [2, PayrollStatus.REVIEW]] as const) {
        const run = await prisma.payrollRun.create({
            data: {
                periodMonth: month, periodYear: 2026, status,
                totalGross: 0, totalDeductions: 0, totalNet: 0, totalTax: 0,
                totalBpjsCompany: 0, totalBpjsEmployee: 0,
                runById: adminUser.id,
                approvedById: status === PayrollStatus.FINALIZED ? adminUser.id : null,
                finalizedAt: status === PayrollStatus.FINALIZED ? new Date(2026, month - 1, 28) : null,
            },
        });

        let tGross = 0, tDed = 0, tNet = 0, tTax = 0, tBpjsC = 0, tBpjsE = 0;

        for (const empNum of allEmpNums) {
            const empDef = employeeDefs.find(e => e.num === empNum) || { grade: 6 };
            const basic = salaryByGrade[empDef.grade] || 30000000;
            const allowance = basic * 0.1;
            const overtime = Math.floor(Math.random() * 3) * basic * 0.005;
            const gross = basic + allowance + overtime;

            const bpjsKesE = Math.min(gross, 12000000) * 0.01;
            const bpjsKesC = Math.min(gross, 12000000) * 0.04;
            const bpjsJhtE = gross * 0.02;
            const bpjsJhtC = gross * 0.037;
            const bpjsJpE = Math.min(gross, 10042300) * 0.01;
            const bpjsJpC = Math.min(gross, 10042300) * 0.02;
            const bpjsJkkC = gross * 0.0054;
            const bpjsJkmC = gross * 0.003;
            const pph21 = gross * 0.025; // Simplified TER rate
            const totalDed = bpjsKesE + bpjsJhtE + bpjsJpE + pph21;
            const net = gross - totalDed;

            tGross += gross; tDed += totalDed; tNet += net; tTax += pph21;
            tBpjsC += bpjsKesC + bpjsJhtC + bpjsJpC + bpjsJkkC + bpjsJkmC;
            tBpjsE += bpjsKesE + bpjsJhtE + bpjsJpE;

            const item = await prisma.payrollItem.create({
                data: {
                    payrollRunId: run.id, employeeId: employeeIds[empNum],
                    basicSalary: basic, totalAllowances: allowance, totalOvertime: overtime,
                    grossIncome: gross, pph21Amount: pph21,
                    bpjsKesEmployee: bpjsKesE, bpjsKesCompany: bpjsKesC,
                    bpjsTkJhtEmployee: bpjsJhtE, bpjsTkJhtCompany: bpjsJhtC,
                    bpjsTkJpEmployee: bpjsJpE, bpjsTkJpCompany: bpjsJpC,
                    bpjsTkJkkCompany: bpjsJkkC, bpjsTkJkmCompany: bpjsJkmC,
                    totalDeductions: totalDed, netSalary: net,
                    components: { basic, transportAllowance: allowance, overtime },
                },
            });

            // Monthly tax record
            if (taxConfig) {
                await prisma.monthlyTax.create({
                    data: {
                        employeeId: employeeIds[empNum], payrollItemId: item.id,
                        month, year: 2026, grossIncome: gross,
                        ptkpStatus: empDef.grade >= 4 ? 'K/1' : 'TK/0',
                        taxableIncome: gross * 12 - 54000000 > 0 ? (gross * 12 - 54000000) / 12 : 0,
                        taxAmount: pph21, ytdGross: gross * month, ytdTax: pph21 * month,
                        configId: taxConfig.id,
                    },
                });
            }
        }

        await prisma.payrollRun.update({
            where: { id: run.id },
            data: { totalGross: tGross, totalDeductions: tDed, totalNet: tNet, totalTax: tTax, totalBpjsCompany: tBpjsC, totalBpjsEmployee: tBpjsE },
        });
    }
    console.log('  ✅ Payroll runs created (Jan & Feb 2026)');

    // ── 9. Recruitment data ──
    console.log('📝 Creating recruitment data...');
    const reqs = [
        { title: 'Full Stack Developer', dept: 'D-IT', pos: 'P-DEV', head: 2, loc: 'Jakarta (Hybrid)', status: RequisitionStatus.OPEN, desc: 'Looking for experienced full-stack developer with React & Node.js expertise.', req: '- 3+ years React/Next.js\n- Node.js & PostgreSQL\n- Git workflow\n- English proficiency' },
        { title: 'Finance Analyst', dept: 'D-FIN', pos: 'P-ACC', head: 1, loc: 'Jakarta (On-site)', status: RequisitionStatus.OPEN, desc: 'Finance analyst for monthly reporting and budgeting.', req: '- Accounting degree\n- 2+ years experience\n- SAP knowledge preferred' },
        { title: 'Operations Coordinator', dept: 'D-OPS', pos: 'P-OPS', head: 1, loc: 'Surabaya', status: RequisitionStatus.PENDING_APPROVAL, desc: 'Coordinate daily operations and logistics.', req: '- Supply chain experience\n- Strong communication\n- Willing to travel' },
    ];
    const reqIds: string[] = [];
    for (const r of reqs) {
        const jr = await prisma.jobRequisition.create({
            data: {
                title: r.title,
                departmentId: deptMap[r.dept]!.id,
                positionId: posMap[r.pos],
                headcount: r.head,
                location: r.loc,
                status: r.status,
                description: r.desc,
                requirements: r.req,
                requestedById: adminEmployee.id,
                targetDate: new Date('2026-04-01'),
            },
        });
        reqIds.push(jr.id);
    }

    const candidates = [
        { first: 'Andi', last: 'Suryaningrat', email: 'andi.surya@gmail.com', phone: '+628111222333', source: 'LinkedIn' },
        { first: 'Bella', last: 'Maharani', email: 'bella.maharani@yahoo.com', phone: '+628222333444', source: 'JobStreet' },
        { first: 'Cahyo', last: 'Wibowo', email: 'cahyo.wibowo@gmail.com', phone: '+628333444555', source: 'Referral' },
        { first: 'Diana', last: 'Putri', email: 'diana.putri@outlook.com', phone: '+628444555666', source: 'LinkedIn' },
        { first: 'Eko', last: 'Prabowo', email: 'eko.prabowo@gmail.com', phone: '+628555666777', source: 'Company Website' },
        { first: 'Fitri', last: 'Rahmawati', email: 'fitri.rahmawati@gmail.com', phone: '+628666777888', source: 'Indeed' },
        { first: 'Galih', last: 'Nugroho', email: 'galih.nugroho@gmail.com', phone: '+628777888999', source: 'Referral' },
        { first: 'Hana', last: 'Salsabila', email: 'hana.salsabila@gmail.com', phone: '+628888999000', source: 'Glints' },
    ];
    const candIds: string[] = [];
    for (const c of candidates) {
        const cand = await prisma.candidate.create({
            data: { firstName: c.first, lastName: c.last, email: c.email, phone: c.phone, source: c.source },
        });
        candIds.push(cand.id);
    }

    const apps: { req: number; cand: number; status: ApplicationStatus; salary: number }[] = [
        { req: 0, cand: 0, status: ApplicationStatus.INTERVIEW, salary: 15000000 },
        { req: 0, cand: 1, status: ApplicationStatus.SCREENING, salary: 12000000 },
        { req: 0, cand: 2, status: ApplicationStatus.OFFER, salary: 18000000 },
        { req: 0, cand: 3, status: ApplicationStatus.NEW, salary: 14000000 },
        { req: 1, cand: 4, status: ApplicationStatus.INTERVIEW, salary: 12000000 },
        { req: 1, cand: 5, status: ApplicationStatus.NEW, salary: 10000000 },
        { req: 2, cand: 6, status: ApplicationStatus.SCREENING, salary: 8000000 },
        { req: 2, cand: 7, status: ApplicationStatus.NEW, salary: 7000000 },
    ];
    const appIds: string[] = [];
    for (const a of apps) {
        const app = await prisma.application.create({
            data: { requisitionId: reqIds[a.req], candidateId: candIds[a.cand], status: a.status, expectedSalary: a.salary, notes: 'Reviewed by HR team.' },
        });
        appIds.push(app.id);
    }

    // Interviews
    const interviews = [
        { app: 0, interviewer: 'EMP-0003', date: '2026-02-20T10:00:00', type: 'Technical', result: 'PASS', feedback: 'Strong coding skills, good problem-solving approach.' },
        { app: 2, interviewer: 'EMP-0003', date: '2026-02-18T14:00:00', type: 'Technical', result: 'PASS', feedback: 'Excellent system design knowledge.' },
        { app: 2, interviewer: 'EMP-0001', date: '2026-02-22T10:00:00', type: 'HR Interview', result: 'PASS', feedback: 'Great cultural fit, strong communication.' },
        { app: 4, interviewer: 'EMP-0012', date: '2026-02-25T09:00:00', type: 'Technical', result: null, feedback: null },
        { app: 0, interviewer: 'EMP-0001', date: '2026-02-24T13:00:00', type: 'HR Interview', result: null, feedback: null },
    ];
    for (const iv of interviews) {
        await prisma.interview.create({
            data: {
                applicationId: appIds[iv.app], interviewerId: employeeIds[iv.interviewer],
                scheduledDate: new Date(iv.date), type: iv.type,
                result: iv.result, feedback: iv.feedback, durationMinutes: 60,
            },
        });
    }
    console.log('  ✅ Recruitment data created (3 requisitions, 8 candidates, 8 applications, 5 interviews)');

    // ── 10. Performance management ──
    console.log('📈 Creating performance data...');
    const cycle = await prisma.performanceCycle.create({
        data: { name: 'Annual Review 2025', description: 'Annual performance review for all staff', startDate: new Date('2025-12-01'), endDate: new Date('2026-02-28'), isActive: true },
    });

    const goalTemplates = [
        { title: 'Achieve Q1 KPI Targets', desc: 'Meet or exceed assigned quarterly KPI targets', weight: 40 },
        { title: 'Process Improvement', desc: 'Identify and implement at least 2 process improvements', weight: 30 },
        { title: 'Team Collaboration', desc: 'Contribute actively to cross-functional projects', weight: 30 },
    ];

    const appraisalEmps = ['EMP-0002', 'EMP-0004', 'EMP-0005', 'EMP-0006', 'EMP-0007', 'EMP-0008', 'EMP-0010', 'EMP-0013', 'EMP-0014', 'EMP-0015'];
    const getManager = (emp: string): string => {
        const def = employeeDefs.find(e => e.num === emp);
        if (!def) return adminEmployee.id;
        return managerAssignments[def.dept] || adminEmployee.id;
    };

    const statuses = [AppraisalStatus.COMPLETED, AppraisalStatus.COMPLETED, AppraisalStatus.MANAGER_ASSESSMENT, AppraisalStatus.SELF_ASSESSMENT, AppraisalStatus.COMPLETED, AppraisalStatus.SELF_ASSESSMENT, AppraisalStatus.DRAFT, AppraisalStatus.COMPLETED, AppraisalStatus.MANAGER_ASSESSMENT, AppraisalStatus.SELF_ASSESSMENT];

    for (let i = 0; i < appraisalEmps.length; i++) {
        const empNum = appraisalEmps[i];
        const st = statuses[i];
        const selfScore = st === AppraisalStatus.COMPLETED || st === AppraisalStatus.MANAGER_ASSESSMENT ? 3 + Math.random() * 1.5 : null;
        const mgrScore = st === AppraisalStatus.COMPLETED ? 3 + Math.random() * 1.5 : null;
        const finalScore = st === AppraisalStatus.COMPLETED ? (((selfScore || 0) + (mgrScore || 0)) / 2) : null;

        const appraisal = await prisma.appraisal.create({
            data: {
                cycleId: cycle.id, employeeId: employeeIds[empNum], managerId: getManager(empNum),
                status: st, selfScore: selfScore ? parseFloat(selfScore.toFixed(2)) : null,
                managerScore: mgrScore ? parseFloat(mgrScore.toFixed(2)) : null,
                finalScore: finalScore ? parseFloat(finalScore.toFixed(2)) : null,
                summaryFeedback: st === AppraisalStatus.COMPLETED ? 'Good performance overall. Keep up the excellent work.' : null,
            },
        });

        for (const gt of goalTemplates) {
            const hasSelf = st !== AppraisalStatus.DRAFT;
            const hasMgr = st === AppraisalStatus.COMPLETED;
            await prisma.goal.create({
                data: {
                    appraisalId: appraisal.id, title: gt.title, description: gt.desc,
                    weight: gt.weight,
                    status: st === AppraisalStatus.COMPLETED ? 'COMPLETED' : st === AppraisalStatus.DRAFT ? 'NOT_STARTED' : 'ON_TRACK',
                    selfRating: hasSelf ? 3 + Math.floor(Math.random() * 2) : null,
                    managerRating: hasMgr ? 3 + Math.floor(Math.random() * 2) : null,
                },
            });
        }
    }
    console.log('  ✅ Performance data created (1 cycle, 10 appraisals, 30 goals)');

    // ── 11. Employment history ──
    console.log('📜 Creating employment history...');
    const histories = [
        { emp: 'EMP-0003', type: EmployeeChangeType.PROMOTION, date: '2025-01-01', old: { grade: 'Grade IV' }, new_: { grade: 'Grade V' }, reason: 'Annual performance review - promoted to senior role' },
        { emp: 'EMP-0005', type: EmployeeChangeType.TRANSFER, date: '2024-06-01', old: { department: 'IT' }, new_: { department: 'Operations' }, reason: 'Cross-functional transfer to strengthen operations team' },
        { emp: 'EMP-0009', type: EmployeeChangeType.GRADE_CHANGE, date: '2025-06-01', old: { grade: 'Grade IV' }, new_: { grade: 'Grade V' }, reason: 'Merit-based grade increase' },
        { emp: 'EMP-0012', type: EmployeeChangeType.PROMOTION, date: '2024-12-01', old: { position: 'Accountant' }, new_: { position: 'Finance Manager' }, reason: 'Promoted to Finance Manager' },
        { emp: 'EMP-0015', type: EmployeeChangeType.STATUS_CHANGE, date: '2026-01-02', old: { status: 'ACTIVE' }, new_: { status: 'PROBATION' }, reason: 'Contract renewal with probation period' },
    ];
    for (const h of histories) {
        await prisma.employmentHistory.create({
            data: {
                employeeId: employeeIds[h.emp], changeType: h.type,
                effectiveDate: new Date(h.date), oldValue: h.old, newValue: h.new_,
                reason: h.reason, approvedById: adminEmployee.id,
            },
        });
    }
    console.log('  ✅ Employment history created');

    // ── 12. Audit logs ──
    console.log('🔒 Creating audit logs...');
    const auditActions = [
        { action: 'LOGIN', entity: 'User', id: adminUser.id, old: null, new_: { ip: '192.168.1.100' } },
        { action: 'CREATE_EMPLOYEE', entity: 'Employee', id: employeeIds['EMP-0010'], old: null, new_: { name: 'Siti Aminah' } },
        { action: 'APPROVE_LEAVE', entity: 'LeaveRequest', id: 'sample', old: { status: 'PENDING' }, new_: { status: 'APPROVED' } },
        { action: 'RUN_PAYROLL', entity: 'PayrollRun', id: 'sample', old: null, new_: { month: 1, year: 2026 } },
        { action: 'UPDATE_EMPLOYEE', entity: 'Employee', id: employeeIds['EMP-0003'], old: { grade: 4 }, new_: { grade: 5 } },
        { action: 'CREATE_REQUISITION', entity: 'JobRequisition', id: reqIds[0], old: null, new_: { title: 'Full Stack Developer' } },
        { action: 'LOGIN', entity: 'User', id: adminUser.id, old: null, new_: { ip: '192.168.1.101' } },
        { action: 'APPROVE_OVERTIME', entity: 'OvertimeRequest', id: 'sample', old: { status: 'PENDING' }, new_: { status: 'APPROVED' } },
    ];
    for (let i = 0; i < auditActions.length; i++) {
        const a = auditActions[i];
        await prisma.auditLog.create({
            data: {
                userId: adminUser.id, action: a.action, entityType: a.entity, entityId: a.id,
                oldValues: a.old || undefined, newValues: a.new_ || undefined,
                ipAddress: '192.168.1.100', userAgent: 'Mozilla/5.0 (Macintosh)',
                createdAt: new Date(2026, 1, 1 + i * 3, 9, 0),
            },
        });
    }
    console.log('  ✅ Audit logs created');

    console.log('\n🎉 Comprehensive sample data seeded successfully!');
    console.log('   📊 16 employees, 5 user accounts, 11 family members');
    console.log('   ⏰ ~300 attendance records, 6 overtime requests');
    console.log('   🏖️ 60+ leave balances, 8 leave requests');
    console.log('   💰 2 payroll runs with 32 payroll items');
    console.log('   📝 3 job requisitions, 8 candidates, 8 applications, 5 interviews');
    console.log('   📈 1 performance cycle, 10 appraisals, 30 goals');
    console.log('   📜 5 employment history records, 8 audit logs');
}

main()
    .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
