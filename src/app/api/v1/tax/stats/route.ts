import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { requirePermission } from "@/lib/auth/permissions";
import { prisma as db } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";

export async function GET() {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const forbidden = requirePermission(session, "payroll.read"); // Reusing payroll permission, or could be 'reports.read'
        if (forbidden) return forbidden;

        const currentYear = new Date().getFullYear();

        // Fetch active tax config for methods and PTKP
        const activeTaxConfig = await db.taxConfig.findFirst({
            where: { isActive: true }
        });

        const method = activeTaxConfig?.method || "TER";
        const ptkpAmounts: any = activeTaxConfig?.ptkpValues || {
            "TK_0": 54000000, "TK_1": 58500000, "K_0": 58500000, "K_1": 63000000,
            "K_2": 67500000, "K_3": 72000000, "TK_2": 63000000, "TK_3": 67500000
        };

        // Get Monthly Tax Data for the current year
        const monthlyTaxes = await db.monthlyTax.findMany({
            where: { year: currentYear },
            select: {
                month: true,
                employeeId: true,
                grossIncome: true,
                taxableIncome: true,
                taxAmount: true,
                ptkpStatus: true
            }
        });

        // 1. Calculate Monthly Summary (Table data)
        const monthlySummaryMap = new Map();
        
        // Find the 'current month' as the max month in the data
        let maxMonth = 0;
        let ytdGross = 0;
        let ytdTax = 0;
        const employeeSet = new Set();
        
        // For PTKP Distribution
        const ptkpCounts: Record<string, number> = {};

        monthlyTaxes.forEach(record => {
            const m = record.month;
            if (m > maxMonth) maxMonth = m;
            
            // Year to Date totals
            ytdGross += Number(record.grossIncome);
            ytdTax += Number(record.taxAmount);
            employeeSet.add(record.employeeId);

            // Per month aggregation
            if (!monthlySummaryMap.has(m)) {
                monthlySummaryMap.set(m, {
                    monthName: new Date(currentYear, m - 1).toLocaleString('default', { month: 'long' }),
                    monthIndex: m,
                    gross: 0,
                    taxable: 0,
                    tax: 0,
                    employeeIds: new Set()
                });
            }
            const monthData = monthlySummaryMap.get(m);
            monthData.gross += Number(record.grossIncome);
            monthData.taxable += Number(record.taxableIncome);
            monthData.tax += Number(record.taxAmount);
            monthData.employeeIds.add(record.employeeId);
            
            // PTKP distribution (Unique per employee per year, assuming status is static per year, so we just count latest)
            if (m === maxMonth) {
                 ptkpCounts[record.ptkpStatus] = (ptkpCounts[record.ptkpStatus] || 0) + 1;
            }
        });

        const monthlySummary = Array.from(monthlySummaryMap.values())
            .sort((a, b) => a.monthIndex - b.monthIndex)
            .map(m => ({
                month: m.monthName,
                gross: m.gross,
                taxable: m.taxable,
                tax: m.tax,
                employees: m.employeeIds.size
            }));

        const currentMonthMapData = monthlySummaryMap.get(maxMonth);
        const currentMonthTax = currentMonthMapData?.tax || 0;
        const currentMonthName = currentMonthMapData?.monthName || '—';

        // 2. Format PTKP Distribution
        const ptkpCategoriesMap = {
            "TK_0": "Single, 0 dependents",
            "TK_1": "Single, 1 dependent",
            "TK_2": "Single, 2 dependents",
            "TK_3": "Single, 3 dependents",
            "K_0": "Married, 0 dependents",
            "K_1": "Married, 1 dependent",
            "K_2": "Married, 2 dependents",
            "K_3": "Married, 3 dependents"
        };

        const ptkpDistribution = Object.keys(ptkpCategoriesMap).map(key => {
            const dbKey = key.replace('_', '/'); // "TK_0" -> "TK/0"
            return {
                status: dbKey,
                description: ptkpCategoriesMap[key as keyof typeof ptkpCategoriesMap],
                amount: ptkpAmounts[key] || 0,
                count: ptkpCounts[dbKey] || 0
            }
        });

        // 3. For an empty system, provide default numbers
        return NextResponse.json({
            data: {
                currentMonthTax,
                currentMonthName,
                ytdTax,
                ytdGross,
                taxpayersCount: employeeSet.size,
                method,
                ptkpDistribution,
                monthlySummary
            }
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
