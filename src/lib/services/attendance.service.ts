import { prisma } from "@/lib/db/prisma";
import { CreateAttendanceSchema, UpdateAttendanceSchema, ClockInSchema, ClockOutSchema } from "@/lib/validators/attendance.schema";
import { z } from "zod";
import { AttendanceStatus } from "@prisma/client";

export class AttendanceService {
    static async getAttendances(page = 1, limit = 10, employeeId?: string, startDate?: string, endDate?: string) {
        const skip = (page - 1) * limit;

        const where: any = {};
        if (employeeId) where.employeeId = employeeId;

        if (startDate || endDate) {
            where.date = {};
            if (startDate) where.date.gte = new Date(startDate);
            if (endDate) where.date.lte = new Date(endDate);
        }

        const [data, total] = await Promise.all([
            prisma.attendance.findMany({
                where,
                skip,
                take: limit,
                include: {
                    employee: { select: { fullName: true, employeeNumber: true } }
                },
                orderBy: [{ date: "desc" }, { clockIn: "desc" }]
            }),
            prisma.attendance.count({ where })
        ]);

        return {
            data,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
        };
    }

    static async getAttendanceById(id: string) {
        return prisma.attendance.findUnique({
            where: { id },
            include: { employee: true }
        });
    }

    static async createAttendance(payload: z.infer<typeof CreateAttendanceSchema>) {
        // Enforce one record per day per employee
        const existing = await prisma.attendance.findUnique({
            where: {
                employeeId_date: {
                    employeeId: payload.employeeId,
                    date: payload.date
                }
            }
        });

        if (existing) throw new Error("Attendance record for this date already exists");

        return prisma.attendance.create({ data: payload });
    }

    static async updateAttendance(id: string, payload: z.infer<typeof UpdateAttendanceSchema>) {
        return prisma.attendance.update({
            where: { id },
            data: payload
        });
    }

    static async deleteAttendance(id: string) {
        return prisma.attendance.delete({ where: { id } });
    }

    static async clockIn(payload: z.infer<typeof ClockInSchema>) {
        const today = new Date(payload.time);
        today.setHours(0, 0, 0, 0);

        const existing = await prisma.attendance.findFirst({
            where: { employeeId: payload.employeeId, date: today }
        });

        if (existing?.clockIn) {
            throw new Error("Already clocked in today");
        }

        if (existing) {
            return prisma.attendance.update({
                where: { id: existing.id },
                data: {
                    clockIn: payload.time,
                    source: payload.source,
                    notes: payload.notes ? existing.notes + "\\n" + payload.notes : existing.notes
                }
            });
        }

        return prisma.attendance.create({
            data: {
                employeeId: payload.employeeId,
                date: today,
                clockIn: payload.time,
                status: AttendanceStatus.PRESENT,
                source: payload.source,
                notes: payload.notes
            }
        });
    }

    static async clockOut(payload: z.infer<typeof ClockOutSchema>) {
        const today = new Date(payload.time);
        today.setHours(0, 0, 0, 0);

        const existing = await prisma.attendance.findFirst({
            where: { employeeId: payload.employeeId, date: today }
        });

        if (!existing || !existing.clockIn) {
            throw new Error("Cannot clock out without clocking in first");
        }
        if (existing.clockOut) {
            throw new Error("Already clocked out today");
        }

        // Calculate work hours
        const diffMs = payload.time.getTime() - existing.clockIn.getTime();
        const diffHrs = diffMs / (1000 * 60 * 60);
        // Simple 8 hour OT calculation default (hardcoded until config is read)
        let workHours = diffHrs > 9 ? 8 : diffHrs - 1; // 1 hour break
        if (workHours < 0) workHours = 0;
        let overtimeHours = diffHrs > 9 ? diffHrs - 9 : 0;

        return prisma.attendance.update({
            where: { id: existing.id },
            data: {
                clockOut: payload.time,
                workHours,
                overtimeHours,
                notes: payload.notes ? existing.notes + "\\n" + payload.notes : existing.notes
            }
        });
    }

    static async getDailyDashboard(dateString?: string) {
        // Default to today if not provided
        const targetDate = dateString ? new Date(dateString) : new Date();
        targetDate.setHours(0, 0, 0, 0);

        const nextDate = new Date(targetDate);
        nextDate.setDate(targetDate.getDate() + 1);

        // Fetch all active employees
        const activeEmployees = await prisma.employee.findMany({
            where: { employmentStatus: { in: ['ACTIVE', 'PROBATION'] } },
            select: { id: true }
        });
        const totalActive = activeEmployees.length;

        // Fetch attendance for the target date
        const attendances = await prisma.attendance.findMany({
            where: {
                date: {
                    gte: targetDate,
                    lt: nextDate
                }
            },
            include: {
                employee: {
                    select: {
                        fullName: true,
                        department: { select: { name: true } }
                    }
                }
            }
        });

        const presentCount = attendances.filter(a => a.status === 'PRESENT').length;
        const autoLateCount = attendances.filter(a => {
            // Basic lateness logic: Clock-in after 08:00 AM
            if (!a.clockIn) return false;
            const timeToken = new Date(a.clockIn);
            const hours = timeToken.getUTCHours() + 7; // WIB Timezone hack for demo
            const mins = timeToken.getUTCMinutes();
            return (hours > 8) || (hours === 8 && mins > 0);
        }).length;

        // Count Approved leaves for this specific date
        const leaves = await prisma.leaveRequest.count({
            where: {
                status: 'APPROVED',
                startDate: { lte: targetDate },
                endDate: { gte: targetDate }
            }
        });

        const absentCount = totalActive - presentCount - leaves;

        const formatTime = (d: Date | null) => {
            if (!d) return "-";
            return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        };

        const todayList = attendances.map(a => {
            // Re-determine lateness for the table
            let isLate = false;
            if (a.clockIn) {
                const h = a.clockIn.getUTCHours() + 7;
                const m = a.clockIn.getUTCMinutes();
                isLate = (h > 8) || (h === 8 && m > 0);
            }

            return {
                name: a.employee.fullName,
                department: a.employee.department?.name || "-",
                clockIn: formatTime(a.clockIn),
                clockOut: formatTime(a.clockOut),
                status: isLate ? "late" : a.status === "PRESENT" ? "ontime" : a.status.toLowerCase(),
                hours: a.workHours ? `${a.workHours.toFixed(2)}h` : "-"
            };
        });

        return {
            stats: {
                present: presentCount,
                late: autoLateCount,
                leave: leaves,
                absent: absentCount > 0 ? absentCount : 0,
                total: totalActive
            },
            recap: todayList
        };
    }
}
