import { NextRequest, NextResponse } from "next/server";
import { getEssSession } from "@/lib/auth/ess-session";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
    try {
        const session = await getEssSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const currentYear = new Date().getFullYear();

        // Get leave balances for current year
        const balances = await prisma.leaveBalance.findMany({
            where: { employeeId: session.employeeId, year: currentYear },
            include: { leaveType: { select: { name: true, code: true, isPaid: true } } },
        });

        // Get leave requests
        const requests = await prisma.leaveRequest.findMany({
            where: { employeeId: session.employeeId },
            include: { leaveType: { select: { name: true, code: true } } },
            orderBy: { startDate: "desc" },
            take: 20,
        });

        return NextResponse.json({ data: { balances, requests } });
    } catch (error) {
        console.error("ESS leave GET error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getEssSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { leaveTypeId, startDate, endDate, totalDays, reason } = body;

        if (!leaveTypeId || !startDate || !endDate || !totalDays || !reason) {
            return NextResponse.json({ error: "All fields are required" }, { status: 400 });
        }

        if (reason.trim().length < 5) {
            return NextResponse.json({ error: "Reason must be at least 5 characters" }, { status: 400 });
        }

        // Verify the employee still exists (guards against stale sessions after DB resets)
        const employee = await prisma.employee.findUnique({
            where: { id: session.employeeId },
            select: { id: true },
        });
        if (!employee) {
            return NextResponse.json(
                { error: "Session expired or employee not found. Please log in again." },
                { status: 401 }
            );
        }

        const leaveType = await prisma.leaveType.findUnique({ where: { id: leaveTypeId } });
        if (!leaveType) {
            return NextResponse.json({ error: "Invalid leave type" }, { status: 400 });
        }

        // Check leave balance
        const currentYear = new Date().getFullYear();
        const balance = await prisma.leaveBalance.findUnique({
            where: {
                employeeId_leaveTypeId_year: {
                    employeeId: employee.id,
                    leaveTypeId,
                    year: currentYear,
                },
            },
        });

        if (balance && leaveType.code !== "LV-SICK") {
            const remaining = Number(balance.entitlement) + Number(balance.carryOver) - Number(balance.used);
            if (totalDays > remaining) {
                return NextResponse.json(
                    { error: `Insufficient leave balance. Available: ${remaining} days` },
                    { status: 400 }
                );
            }
        }

        const leaveRequest = await prisma.leaveRequest.create({
            data: {
                employeeId: employee.id,
                leaveTypeId,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                totalDays,
                reason: reason.trim(),
                status: "PENDING",
            },
            include: { leaveType: { select: { name: true } } },
        });

        return NextResponse.json({ success: true, data: leaveRequest }, { status: 201 });
    } catch (error) {
        console.error("ESS leave POST error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
