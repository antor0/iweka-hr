import { prisma } from "@/lib/db/prisma";
import { GeneratePayrollSchema, UpdatePayrollStatusSchema } from "@/lib/validators/payroll.schema";
import { z } from "zod";
import { PayrollStatus, TaxMethod } from "@prisma/client";

// ─── PPh 21 Helpers ────────────────────────────────────────────────────────

type TerBracket = { min: number; max: number | null; rate: number };
type TerRates = Record<string, TerBracket[]>;

/**
 * Map employee marital status to TER category (A, B, or C)
 * Per PMK 168/2023 & PP 58/2023
 */
function getTerCategory(maritalStatus: string): "A" | "B" | "C" {
    const statusUpper = (maritalStatus || "TK_0").toUpperCase();
    if (statusUpper === "K_3") return "C";
    if (["TK_2", "TK_3", "K_1", "K_2"].includes(statusUpper)) return "B";
    return "A"; // TK_0, TK_1, K_0 → A
}

/**
 * Look up TER rate for a gross income in a given category.
 * Falls back to 0 if no TER rates configured (HR can set them via Settings).
 */
function lookupTerRate(terRates: TerRates, category: "A" | "B" | "C", grossMonthly: number): number {
    const brackets: TerBracket[] = terRates?.[category] ?? [];
    for (const bracket of brackets) {
        const inLower = grossMonthly >= bracket.min;
        const inUpper = bracket.max === null || grossMonthly <= bracket.max;
        if (inLower && inUpper) return bracket.rate;
    }
    return 0;
}

/**
 * Apply progressive tax brackets to an annual taxable income.
 */
function applyProgressiveBrackets(
    brackets: { max: number | null; rate: number }[],
    annualTaxableIncome: number
): number {
    if (annualTaxableIncome <= 0) return 0;
    let tax = 0;
    let remaining = annualTaxableIncome;
    let previousMax = 0;

    for (const bracket of brackets) {
        if (remaining <= 0) break;
        const layerTop = bracket.max === null ? remaining : Math.min(bracket.max, annualTaxableIncome);
        const layerSize = layerTop - previousMax;
        const taxableInLayer = Math.min(remaining, layerSize);
        tax += taxableInLayer * bracket.rate;
        remaining -= taxableInLayer;
        previousMax = layerTop;
        if (bracket.max === null) break;
    }
    return Math.max(0, tax);
}

// ─── Working Day Helpers ───────────────────────────────────────────────────

/**
 * Count business days (Mon–Fri) in a date range, inclusive.
 */
function countWorkingDays(start: Date, end: Date): number {
    let count = 0;
    const cur = new Date(start);
    while (cur <= end) {
        const day = cur.getDay();
        if (day !== 0 && day !== 6) count++;
        cur.setDate(cur.getDate() + 1);
    }
    return count;
}

// ─── Main Service ──────────────────────────────────────────────────────────

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
                        employee: {
                            select: {
                                fullName: true,
                                employeeNumber: true,
                                position: { select: { title: true } }
                            }
                        },
                        monthlyTax: true
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

        // ── Fetch Configs ────────────────────────────────────────────────
        const taxConfig = await prisma.taxConfig.findFirst({
            where: { isActive: true },
            orderBy: { effectiveDate: "desc" }
        });
        if (!taxConfig) throw new Error("Missing active Tax Configuration. Please configure Tax settings first.");

        const bpjsConfig = await prisma.bpjsConfig.findFirst({
            where: { isActive: true },
            orderBy: { effectiveDate: "desc" }
        });
        if (!bpjsConfig) throw new Error("Missing active BPJS Configuration. Please configure BPJS settings first.");

        const companyConfig = await prisma.companyConfig.findFirst();
        const lateGracePeriodMins = companyConfig?.lateGracePeriodMins ?? 15;
        const latePenaltyAmount = Number(companyConfig?.latePenaltyAmount ?? 0);

        // ── Fetch Target Employees ───────────────────────────────────────
        const whereArgs: any = { employmentStatus: "ACTIVE" };
        if (employeeIds && employeeIds.length > 0) {
            whereArgs.id = { in: employeeIds };
        }

        const employees = await prisma.employee.findMany({
            where: whereArgs,
            include: { grade: true }
        });

        // ── Period Boundaries ────────────────────────────────────────────
        const startDate = new Date(Date.UTC(periodYear, periodMonth - 1, 1));
        const endDate = new Date(Date.UTC(periodYear, periodMonth, 0));
        const totalWorkingDays = countWorkingDays(startDate, endDate);

        const isDecember = periodMonth === 12;
        const taxMethod = taxConfig.method;

        const itemsData: any[] = [];
        const monthlyTaxData: any[] = [];
        let rTotalGross = 0;
        let rTotalDeductions = 0;
        let rTotalNet = 0;
        let rTotalTax = 0;
        let rTotalBpjsComp = 0;
        let rTotalBpjsEmp = 0;

        for (const emp of employees) {
            // ── 1. Basic Salary ──────────────────────────────────────────
            let basicSalary = 0;
            if (emp.baseSalary) {
                basicSalary = Number(emp.baseSalary);
            } else if (emp.grade?.minSalary && emp.grade?.maxSalary) {
                basicSalary = (Number(emp.grade.minSalary) + Number(emp.grade.maxSalary)) / 2;
            }

            // ── 2. Mid-Month Hire Proration ──────────────────────────────
            let proratedDays: number | null = null;
            let proratedDeduction = 0;
            if (emp.hireDate) {
                const hire = new Date(emp.hireDate);
                if (hire >= startDate && hire <= endDate) {
                    const workingDaysFromHire = countWorkingDays(hire, endDate);
                    proratedDays = workingDaysFromHire;
                    const fullSalary = basicSalary;
                    basicSalary = (basicSalary / totalWorkingDays) * workingDaysFromHire;
                    proratedDeduction = fullSalary - basicSalary;
                }
            }

            // ── 3. Timesheets ────────────────────────────────────────────
            const timesheets = await prisma.timesheet.findMany({
                where: { employeeId: emp.id, date: { gte: startDate, lte: endDate } }
            });
            const daysPresent = timesheets.filter(t => t.status === "PRESENT" || t.status === "LATE").length;
            const lateOccurrences = timesheets.filter(
                t => t.status === "LATE" && Number(t.lateMinutes ?? 0) > lateGracePeriodMins
            ).length;

            // ── 4. Allowances ────────────────────────────────────────────
            const allowances = await prisma.employeeAllowance.findMany({
                where: { employeeId: emp.id, isActive: true }
            });

            let totalAllowances = 0;
            const allowanceBreakdown: any[] = [];
            for (const allowance of allowances) {
                let amount = 0;
                if (allowance.basis === "FIXED_AMOUNT") {
                    amount = Number(allowance.amount);
                } else if (allowance.basis === "ATTENDANCE_BASED") {
                    amount = Number(allowance.amount) * daysPresent;
                }
                totalAllowances += amount;
                allowanceBreakdown.push({
                    name: allowance.name,
                    basis: allowance.basis,
                    perDay: allowance.basis === "ATTENDANCE_BASED" ? Number(allowance.amount) : null,
                    days: allowance.basis === "ATTENDANCE_BASED" ? daysPresent : null,
                    amount
                });
            }

            // ── 5. Monthly Variable Inputs (THR, OT, Bonus, Commission, Manual Deduction) ──
            const vars = await prisma.monthlyVariableInput.findUnique({
                where: { employeeId_month_year: { employeeId: emp.id, month: periodMonth, year: periodYear } }
            });

            const thrAmount = vars ? Number(vars.thrAmount) : 0;
            const overtimePay = vars ? Number(vars.overtimeAmount) : 0;
            const commission = vars ? Number(vars.commissionAmount) : 0;
            const bonus = vars ? Number(vars.bonusAmount) : 0;
            const manualDeduction = vars ? Number(vars.deductionAmount) : 0;

            // ── 6. Monthly Incentives ────────────────────────────────────
            const incentiveRecord = await prisma.monthlyIncentive.findUnique({
                where: { employeeId_month_year: { employeeId: emp.id, month: periodMonth, year: periodYear } }
            });
            const incentiveAmount = incentiveRecord ? Number(incentiveRecord.incentive) : 0;
            const incentiveBonusAmount = incentiveRecord ? Number(incentiveRecord.bonus) : 0;

            // ── 7. Gross Income ──────────────────────────────────────────
            const totalVariablePay = thrAmount + overtimePay + commission + bonus;
            const totalIncentives = incentiveAmount + incentiveBonusAmount;
            const grossIncome = basicSalary + totalAllowances + totalVariablePay + totalIncentives;

            // ── 8. BPJS Calculation ──────────────────────────────────────
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

            // ── 9. PPh 21 Tax Calculation ────────────────────────────────
            const maritalStatus = emp.maritalStatus ?? "TK_0";
            const ptkpValues = taxConfig.ptkpValues as Record<string, number>;
            const ptkpAnnual = ptkpValues[maritalStatus] ?? ptkpValues["TK_0"] ?? 54000000;
            const ptkpMonthly = ptkpAnnual / 12;

            let taxAmount = 0;
            let terCategory: "A" | "B" | "C" = "A";
            let terRate = 0;

            if (taxMethod === TaxMethod.TER && !isDecember) {
                // ── TER Method (Jan–Nov) ──────────────────────────────
                terCategory = getTerCategory(maritalStatus);
                const terRates = taxConfig.terRates as TerRates | null;

                if (terRates && Object.keys(terRates).length > 0) {
                    terRate = lookupTerRate(terRates, terCategory, grossIncome);
                    taxAmount = grossIncome * terRate;
                } else {
                    // Fallback: simplified if TER table not configured
                    if (grossIncome > ptkpMonthly) {
                        const annualTaxable = (grossIncome - ptkpMonthly) * 12;
                        const brackets = taxConfig.brackets as { max: number | null; rate: number }[];
                        taxAmount = applyProgressiveBrackets(brackets, annualTaxable) / 12;
                    }
                }
            } else {
                // ── Progressive Method (December or PROGRESSIVE method) ──
                // Fetch YTD gross and tax from MonthlyTax for accurate December reconciliation
                const ytdRecords = await prisma.monthlyTax.findMany({
                    where: { employeeId: emp.id, year: periodYear, month: { lt: periodMonth } },
                    orderBy: { month: "asc" }
                });
                const ytdGross = ytdRecords.reduce((s, r) => s + Number(r.grossIncome), 0) + grossIncome;
                const ytdTaxPaid = ytdRecords.reduce((s, r) => s + Number(r.taxAmount), 0);

                const annualTaxable = Math.max(0, ytdGross - ptkpAnnual);
                const brackets = taxConfig.brackets as { max: number | null; rate: number }[];
                const annualTax = applyProgressiveBrackets(brackets, annualTaxable);

                // December: reconcile — pay the difference vs. what was already paid
                taxAmount = Math.max(0, annualTax - ytdTaxPaid);
            }

            // ── 10. Unpaid Leave Deduction ────────────────────────────────
            const unpaidLeaveRequests = await prisma.leaveRequest.findMany({
                where: {
                    employeeId: emp.id,
                    status: "APPROVED",
                    leaveType: { isPaid: false },
                    startDate: { lte: endDate },
                    endDate: { gte: startDate }
                },
                include: { leaveType: true }
            });
            const unpaidLeaveDays = unpaidLeaveRequests.reduce((s, r) => s + Number(r.totalDays), 0);
            const unpaidLeaveDeduction = totalWorkingDays > 0
                ? (basicSalary / totalWorkingDays) * unpaidLeaveDays
                : 0;

            // ── 11. Late Penalty ─────────────────────────────────────────
            const totalLatePenalty = lateOccurrences * latePenaltyAmount;

            // ── 12. Net Salary ────────────────────────────────────────────
            const totalDeductions = totalBpjsEmp + taxAmount + unpaidLeaveDeduction + totalLatePenalty + manualDeduction;
            const netSalary = grossIncome - totalDeductions;

            // ── 13. Enriched Components JSON ──────────────────────────────
            const components = {
                earnings: {
                    baseSalary: basicSalary,
                    proratedDays,
                    allowances: allowanceBreakdown,
                    variableInputs: { thr: thrAmount, overtime: overtimePay, bonus, commission },
                    incentives: { incentive: incentiveAmount, bonus: incentiveBonusAmount }
                },
                deductions: {
                    bpjs: {
                        kesEmployee: bpjsKesEmp,
                        jhtEmployee: bpjsJhtEmp,
                        jpEmployee: bpjsJpEmp
                    },
                    pph21: {
                        method: taxMethod,
                        category: terCategory,
                        rate: terRate,
                        amount: taxAmount,
                        ptkpCode: maritalStatus,
                        ptkpMonthly
                    },
                    unpaidLeave: { days: unpaidLeaveDays, amount: unpaidLeaveDeduction },
                    latePenalty: { occurrences: lateOccurrences, amount: totalLatePenalty },
                    manualDeduction
                },
                companyCost: {
                    kesCompany: bpjsKesComp,
                    jhtCompany: bpjsJhtComp,
                    jpCompany: bpjsJpComp,
                    jkkCompany: bpjsJkkComp,
                    jkmCompany: bpjsJkmComp
                }
            };

            itemsData.push({
                employeeId: emp.id,
                basicSalary,
                totalAllowances,
                totalOvertime: overtimePay,
                totalIncentives,
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
                components
            });

            monthlyTaxData.push({
                employeeId: emp.id,
                month: periodMonth,
                year: periodYear,
                grossIncome,
                ptkpStatus: maritalStatus,
                taxableIncome: Math.max(0, grossIncome - ptkpMonthly),
                taxAmount,
                ytdGross: grossIncome,     // will be updated to real YTD on finalization view
                ytdTax: taxAmount,
                configId: taxConfig.id
            });

            rTotalGross += grossIncome;
            rTotalDeductions += totalDeductions;
            rTotalNet += netSalary;
            rTotalTax += taxAmount;
            rTotalBpjsComp += totalBpjsComp;
            rTotalBpjsEmp += totalBpjsEmp;
        }

        // ── Save Transactionally ──────────────────────────────────────────
        return prisma.$transaction(async (tx) => {
            let runId = existing?.id;

            if (existing) {
                // Wipe previous items and monthly tax records for a re-run
                await tx.monthlyTax.deleteMany({ where: { payrollItem: { payrollRunId: existing.id } } });
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

            // Insert PayrollItems
            if (itemsData.length > 0) {
                const createdItems = await Promise.all(
                    itemsData.map(i =>
                        tx.payrollItem.create({ data: { ...i, payrollRunId: runId! } })
                    )
                );

                // Insert MonthlyTax records linked to PayrollItems
                await Promise.all(
                    createdItems.map((item, idx) =>
                        tx.monthlyTax.upsert({
                            where: { employeeId_month_year: { employeeId: item.employeeId, month: periodMonth, year: periodYear } },
                            update: {
                                ...monthlyTaxData[idx],
                                payrollItemId: item.id
                            },
                            create: {
                                ...monthlyTaxData[idx],
                                payrollItemId: item.id
                            }
                        })
                    )
                );
            }

            return tx.payrollRun.findUnique({
                where: { id: runId! },
                include: { _count: { select: { items: true } } }
            });
        });
    }

    static async updateStatus(id: string, status: PayrollStatus) {
        return prisma.payrollRun.update({
            where: { id },
            data: {
                status,
                ...(status === PayrollStatus.FINALIZED ? { finalizedAt: new Date() } : {})
            }
        });
    }
}
