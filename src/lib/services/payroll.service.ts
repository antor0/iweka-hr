import { prisma } from "@/lib/db/prisma";
import { GeneratePayrollSchema, UpdatePayrollStatusSchema } from "@/lib/validators/payroll.schema";
import { z } from "zod";
import { PayrollStatus, TaxMethod } from "@prisma/client";

export class PayrollService {
    static async getPayrollRuns(page = 1, limit = 10) {
        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            prisma.payrollRun.findMany({
                skip,
                take: limit,
                orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }],
                include: {
                    runBy: { select: { email: true } },
                    _count: { select: { items: true } }
                }
            }),
            prisma.payrollRun.count()
        ]);

        return {
            data,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
        };
    }

    static async getPayrollRunById(id: string) {
        return prisma.payrollRun.findUnique({
            where: { id },
            include: {
                runBy: { select: { email: true } },
                items: {
                    include: {
                        employee: { select: { fullName: true, employeeNumber: true, position: { select: { title: true } } } }
                    }
                }
            }
        });
    }

    // The Core Calculation Engine
    static async generatePayroll(payload: z.infer<typeof GeneratePayrollSchema>, runById: string) {
        const { periodMonth, periodYear, employeeIds } = payload;

        // Ensure no overlapping finalized run
        const existing = await prisma.payrollRun.findUnique({
            where: { periodMonth_periodYear: { periodMonth, periodYear } }
        });

        if (existing && existing.status !== "DRAFT" && existing.status !== "REVIEW") {
            throw new Error("A finalized or processing payroll run already exists for this period");
        }

        // Fetch configs
        const taxConfig = await prisma.taxConfig.findFirst({
            where: { isActive: true },
            orderBy: { effectiveDate: "desc" }
        });
        if (!taxConfig) throw new Error("Missing active Tax Configuration");

        const bpjsConfig = await prisma.bpjsConfig.findFirst({
            where: { isActive: true },
            orderBy: { effectiveDate: "desc" }
        });
        if (!bpjsConfig) throw new Error("Missing active BPJS Configuration");

        // Fetch target employees
        const whereArgs: any = { employmentStatus: "ACTIVE" };
        if (employeeIds && employeeIds.length > 0) {
            whereArgs.id = { in: employeeIds };
        }

        const employees = await prisma.employee.findMany({
            where: whereArgs,
            include: { grade: true }
        });

        // Determine Start/End of the period for attendance checking
        const startDate = new Date(Date.UTC(periodYear, periodMonth - 1, 1));
        const endDate = new Date(Date.UTC(periodYear, periodMonth, 0)); // Last date of month

        const itemsData: any[] = [];
        let rTotalGross = 0;
        let rTotalDeductions = 0;
        let rTotalNet = 0;
        let rTotalTax = 0;
        let rTotalBpjsComp = 0;
        let rTotalBpjsEmp = 0;

        for (const emp of employees) {
            // 1. Basic Salary — use per-employee override if set, else grade midpoint
            let basicSalary = 0;
            if (emp.baseSalary) {
                basicSalary = Number(emp.baseSalary);
            } else if (emp.grade && emp.grade.minSalary && emp.grade.maxSalary) {
                basicSalary = (Number(emp.grade.minSalary) + Number(emp.grade.maxSalary)) / 2;
            }

            // 2. Fetch Timesheets (used for ATTENDANCE_BASED allowances and calculations)
            const timesheets = await prisma.timesheet.findMany({
                where: {
                    employeeId: emp.id,
                    date: { gte: startDate, lte: endDate }
                }
            });
            // "LATE" is informational and counts as PRESENT for financial purposes
            const daysPresent = timesheets.filter(t => t.status === "PRESENT" || t.status === "LATE").length;

            // 3. Allowances Calculation
            const allowances = await prisma.employeeAllowance.findMany({
                where: { employeeId: emp.id, isActive: true }
            });

            let totalAllowances = 0;
            for (const allowance of allowances) {
                if (allowance.basis === "FIXED_AMOUNT") {
                    totalAllowances += Number(allowance.amount);
                } else if (allowance.basis === "ATTENDANCE_BASED") {
                    totalAllowances += Number(allowance.amount) * daysPresent;
                }
            }

            // 4. Monthly Variable Inputs (THR, Overtime, Bonus, Commission)
            const vars = await prisma.monthlyVariableInput.findUnique({
                where: {
                    employeeId_month_year: {
                        employeeId: emp.id,
                        month: periodMonth,
                        year: periodYear
                    }
                }
            });

            const thrAmount = vars ? Number(vars.thrAmount) : 0;
            const overtimePay = vars ? Number(vars.overtimeAmount) : 0;
            const commission = vars ? Number(vars.commissionAmount) : 0;
            const bonus = vars ? Number(vars.bonusAmount) : 0;

            const totalVariablePay = thrAmount + overtimePay + commission + bonus;
            const grossIncome = basicSalary + totalAllowances + totalVariablePay;

            // 4. BPJS Calculation
            const bpjsBase = Math.min(basicSalary, Number(bpjsConfig.kesSalaryCap));
            const jpBase = Math.min(basicSalary, Number(bpjsConfig.jpSalaryCap));

            const bpjsKesEmp = bpjsBase * Number(bpjsConfig.kesEmployeeRate);
            const bpjsKesComp = bpjsBase * Number(bpjsConfig.kesCompanyRate);

            const bpjsJhtEmp = basicSalary * Number(bpjsConfig.jhtEmployeeRate);
            const bpjsJhtComp = basicSalary * Number(bpjsConfig.jhtCompanyRate);

            const bpjsJpEmp = jpBase * Number(bpjsConfig.jpEmployeeRate);
            const bpjsJpComp = jpBase * Number(bpjsConfig.jpCompanyRate);

            const bpjsJkkComp = basicSalary * Number(bpjsConfig.jkkCompanyRate);
            const bpjsJkmComp = basicSalary * Number(bpjsConfig.jkmCompanyRate);

            const totalBpjsEmp = bpjsKesEmp + bpjsJhtEmp + bpjsJpEmp;
            const totalBpjsComp = bpjsKesComp + bpjsJhtComp + bpjsJpComp + bpjsJkkComp + bpjsJkmComp;

            // 5. PPh 21 Calculation (Using TER or Gross up simplified)
            // For Demo, using a flat simplified formula if TER mapping is complex without a full engine
            // If TaxMethod is TER, usually Gross * TER rate based on PTKP
            // PTKP Status is based on marital status
            let ptkpCode = "TK_0";
            if (emp.maritalStatus === "K_0") ptkpCode = "K_0";
            else if (emp.maritalStatus === "K_1") ptkpCode = "K_1";
            else if (emp.maritalStatus === "K_2") ptkpCode = "K_2";
            else if (emp.maritalStatus === "K_3") ptkpCode = "K_3";
            // ... omitting complex rules for demo brevity

            // Let's assume a simplified flat 5% tax for the demo if income > PTKP / 12, else 0
            const ptkpValue = ((taxConfig.ptkpValues as any)[ptkpCode] || 54000000) / 12;
            let taxAmount = 0;
            if (grossIncome > ptkpValue) {
                taxAmount = (grossIncome - ptkpValue) * 0.05; // Using 5% flat for simplify
            }

            // 6. Final Net
            const totalDeductions = totalBpjsEmp + taxAmount;
            const netSalary = grossIncome - totalDeductions;

            itemsData.push({
                employeeId: emp.id,
                basicSalary,
                totalAllowances: totalAllowances,
                totalOvertime: overtimePay,
                grossIncome,
                pph21Amount: taxAmount,
                bpjsKesEmployee: bpjsKesEmp,
                bpjsKesCompany: bpjsKesComp,
                bpjsTkJhtEmployee: bpjsJhtEmp,
                bpjsTkJhtCompany: bpjsJhtComp,
                bpjsTkJpEmployee: bpjsJpEmp,
                bpjsTkJpCompany: bpjsJpComp,
                bpjsTkJkkCompany: bpjsJkkComp,
                bpjsTkJkmCompany: bpjsJkmComp,
                totalDeductions,
                netSalary,
                components: { 
                    allowances: totalAllowances, 
                    thr: thrAmount, 
                    bonus, 
                    commission,
                    overtime: overtimePay
                }
            });

            rTotalGross += grossIncome;
            rTotalDeductions += totalDeductions;
            rTotalNet += netSalary;
            rTotalTax += taxAmount;
            rTotalBpjsComp += totalBpjsComp;
            rTotalBpjsEmp += totalBpjsEmp;
        }

        // 7. Save to Database Transactionally
        return prisma.$transaction(async (tx) => {
            let runId = existing?.id;

            if (existing) {
                // Wipe old items if re-running DRAFT
                await tx.payrollItem.deleteMany({ where: { payrollRunId: existing.id } });
                await tx.payrollRun.update({
                    where: { id: existing.id },
                    data: {
                        totalGross: rTotalGross,
                        totalDeductions: rTotalDeductions,
                        totalNet: rTotalNet,
                        totalTax: rTotalTax,
                        totalBpjsCompany: rTotalBpjsComp,
                        totalBpjsEmployee: rTotalBpjsEmp,
                        configSnapshot: { taxId: taxConfig.id, bpjsId: bpjsConfig.id }
                    }
                });
            } else {
                const newRun = await tx.payrollRun.create({
                    data: {
                        periodMonth,
                        periodYear,
                        status: PayrollStatus.REVIEW,
                        totalGross: rTotalGross,
                        totalDeductions: rTotalDeductions,
                        totalNet: rTotalNet,
                        totalTax: rTotalTax,
                        totalBpjsCompany: rTotalBpjsComp,
                        totalBpjsEmployee: rTotalBpjsEmp,
                        runById,
                        configSnapshot: { taxId: taxConfig.id, bpjsId: bpjsConfig.id }
                    }
                });
                runId = newRun.id;
            }

            // Insert Items
            if (itemsData.length > 0) {
                await tx.payrollItem.createMany({
                    data: itemsData.map(i => ({ ...i, payrollRunId: runId! }))
                });
            }

            return tx.payrollRun.findUnique({ where: { id: runId! } });
        });
    }

    static async updateStatus(id: string, status: PayrollStatus) {
        return prisma.payrollRun.update({
            where: { id },
            data: { status }
        });
    }
}
