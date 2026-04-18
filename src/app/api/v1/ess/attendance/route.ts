import { NextRequest, NextResponse } from "next/server";
import { getEssSession } from "@/lib/auth/ess-session";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
    try {
        const session = await getEssSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const now = new Date();
        // Use local OS timezone to determine "Today"
        const localDateStr = now.toLocaleDateString('en-CA'); 
        const todayDate = new Date(localDateStr); 

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
        const { action, lat, lng } = body; // "clock-in" or "clock-out"

        if (!["clock-in", "clock-out"].includes(action)) {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

        const config = await prisma.companyConfig.findUnique({ where: { id: "default" } });
        const isLocationRequired = config?.requireLocation ?? false;
        const gracePeriod = config?.lateGracePeriodMins ?? 15;

        if (isLocationRequired && (lat === undefined || lng === undefined || lat === null || lng === null)) {
            return NextResponse.json({ error: "Location access is required by company policy for mobile clock-in." }, { status: 400 });
        }

        const now = new Date();
        // Use local OS timezone to determine "Today"
        const localDateStr = now.toLocaleDateString('en-CA'); 
        const todayDate = new Date(localDateStr); 

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

            // Determine late status: 08:00 AM Local Time + grace period
            const shiftStart = new Date(todayDate);
            // shiftStart is local 00:00. Set it to 08:[grace] AM local.
            shiftStart.setHours(8, gracePeriod, 0, 0);
            const isLate = now > shiftStart;

            if (existing) {
                const updated = await prisma.attendance.update({
                    where: { id: existing.id },
                    data: {
                        clockIn: now,
                        clockInLat: lat ?? null,
                        clockInLng: lng ?? null,
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
                        clockInLat: lat ?? null,
                        clockInLng: lng ?? null,
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
                    clockOutLat: lat ?? null,
                    clockOutLng: lng ?? null,
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
