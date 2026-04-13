import { NextRequest, NextResponse } from "next/server";
import { getEssSession } from "@/lib/auth/ess-session";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
    try {
        const session = await getEssSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const today = new Date();
        const todayDate = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));

        const todayAttendance = await prisma.attendance.findUnique({
            where: {
                employeeId_date: {
                    employeeId: session.employeeId,
                    date: todayDate,
                },
            },
        });

        // Get recent attendance history (last 7 days)
        const sevenDaysAgo = new Date(todayDate);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const history = await prisma.attendance.findMany({
            where: {
                employeeId: session.employeeId,
                date: { gte: sevenDaysAgo, lt: todayDate },
            },
            orderBy: { date: "desc" },
            take: 7,
        });

        return NextResponse.json({
            data: {
                today: todayAttendance,
                history,
            },
        });
    } catch (error) {
        console.error("ESS attendance GET error:", error);
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
        const { action } = body; // "clock-in" or "clock-out"

        if (!["clock-in", "clock-out"].includes(action)) {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

        const now = new Date();
        const todayDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

        const existing = await prisma.attendance.findUnique({
            where: {
                employeeId_date: {
                    employeeId: session.employeeId,
                    date: todayDate,
                },
            },
        });

        if (action === "clock-in") {
            if (existing && existing.clockIn) {
                return NextResponse.json({ error: "Already clocked in today" }, { status: 400 });
            }

            // Determine late status: after 08:15
            const shiftStart = new Date(todayDate);
            shiftStart.setHours(8, 15, 0);
            const isLate = now > shiftStart;

            if (existing) {
                const updated = await prisma.attendance.update({
                    where: { id: existing.id },
                    data: {
                        clockIn: now,
                        status: isLate ? "LATE" : "PRESENT",
                        source: "MOBILE",
                    },
                });
                return NextResponse.json({ success: true, data: updated });
            } else {
                const created = await prisma.attendance.create({
                    data: {
                        employeeId: session.employeeId,
                        date: todayDate,
                        clockIn: now,
                        status: isLate ? "LATE" : "PRESENT",
                        source: "MOBILE",
                    },
                });
                return NextResponse.json({ success: true, data: created });
            }
        } else {
            // clock-out
            if (!existing || !existing.clockIn) {
                return NextResponse.json({ error: "Please clock in first" }, { status: 400 });
            }
            if (existing.clockOut) {
                return NextResponse.json({ error: "Already clocked out today" }, { status: 400 });
            }

            const clockInTime = existing.clockIn!;
            const workMs = now.getTime() - clockInTime.getTime();
            const workHours = workMs / (1000 * 60 * 60);
            const overtimeHours = Math.max(0, workHours - 8);

            const updated = await prisma.attendance.update({
                where: { id: existing.id },
                data: {
                    clockOut: now,
                    workHours: parseFloat(workHours.toFixed(2)),
                    overtimeHours: overtimeHours > 0 ? parseFloat(overtimeHours.toFixed(2)) : null,
                },
            });

            return NextResponse.json({ success: true, data: updated });
        }
    } catch (error) {
        console.error("ESS attendance POST error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
