import { NextRequest, NextResponse } from "next/server";
import { getEssSession } from "@/lib/auth/ess-session";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
    try {
        const session = await getEssSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const month = searchParams.get("month");
        const year = searchParams.get("year");

        if (month && year) {
            // Get specific payslip
            const payrollRun = await prisma.payrollRun.findUnique({
                where: {
                    periodMonth_periodYear: {
                        periodMonth: parseInt(month),
                        periodYear: parseInt(year),
                    },
                },
                select: {
                    id: true,
                    periodMonth: true,
                    periodYear: true,
                    status: true,
                    finalizedAt: true,
                },
            });

            if (!payrollRun || !["FINALIZED", "DISBURSED", "APPROVED"].includes(payrollRun.status)) {
                return NextResponse.json({ error: "Payslip not available for this period" }, { status: 404 });
            }

            const payrollItem = await prisma.payrollItem.findUnique({
                where: {
                    payrollRunId_employeeId: {
                        payrollRunId: payrollRun.id,
                        employeeId: session.employeeId,
                    },
                },
                include: {
                    employee: {
                        select: {
                            fullName: true,
                            employeeNumber: true,
                            department: { select: { name: true } },
                            position: { select: { title: true } },
                            bankName: true,
                            bankAccount: true,
                        },
                    },
                },
            });

            if (!payrollItem) {
                return NextResponse.json({ error: "Payslip not found" }, { status: 404 });
            }

            return NextResponse.json({ data: { payrollRun, payrollItem } });
        }

        // List all available payslip periods for this employee
        const items = await prisma.payrollItem.findMany({
            where: { employeeId: session.employeeId },
            include: {
                payrollRun: {
                    select: {
                        periodMonth: true,
                        periodYear: true,
                        status: true,
                        finalizedAt: true,
                    },
                },
            },
            orderBy: { payrollRun: { periodYear: "desc" } },
        });

        // Only return finalized payslips
        const available = items.filter((item) =>
            ["FINALIZED", "DISBURSED", "APPROVED"].includes(item.payrollRun.status)
        );

        // Secondary sort by month desc
        available.sort((a, b) =>
            b.payrollRun.periodYear !== a.payrollRun.periodYear
                ? b.payrollRun.periodYear - a.payrollRun.periodYear
                : b.payrollRun.periodMonth - a.payrollRun.periodMonth
        );

        return NextResponse.json({
            data: available.map((item) => ({
                payrollRunId: item.payrollRunId,
                month: item.payrollRun.periodMonth,
                year: item.payrollRun.periodYear,
                status: item.payrollRun.status,
                netSalary: item.netSalary,
                finalizedAt: item.payrollRun.finalizedAt,
            })),
        });
    } catch (error) {
        console.error("ESS payslip error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
