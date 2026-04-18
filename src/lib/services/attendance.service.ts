import { prisma } from "@/lib/db/prisma";
import { CreateAttendanceSchema, UpdateAttendanceSchema, ClockInSchema, ClockOutSchema } from "@/lib/validators/attendance.schema";
import { z } from "zod";
import { AttendanceStatus } from "@prisma/client";

export class AttendanceService {
    private static getTodayWIB(time: Date = new Date()) {
        const wibTime = new Date(time.getTime() + (7 * 60 * 60 * 1000));
        return new Date(Date.UTC(wibTime.getUTCFullYear(), wibTime.getUTCMonth(), wibTime.getUTCDate()));
    }

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
        const today = this.getTodayWIB(payload.time);

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
                    clockInLat: payload.lat ?? null,
                    clockInLng: payload.lng ?? null,
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
                clockInLat: payload.lat ?? null,
                clockInLng: payload.lng ?? null,
                status: AttendanceStatus.PRESENT,
                source: payload.source,
                notes: payload.notes
            }
        });
    }

    static async clockOut(payload: z.infer<typeof ClockOutSchema>) {
        const today = this.getTodayWIB(payload.time);

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
                clockOutLat: payload.lat ?? null,
                clockOutLng: payload.lng ?? null,
                workHours,
                overtimeHours,
                notes: payload.notes ? existing.notes + "\\n" + payload.notes : existing.notes
            }
        });
    }

    static async getDashboard(period: 'today' | '30d' | '365d' = 'today') {
        const targetDate = this.getTodayWIB();

        let startDate = new Date(targetDate);
        let endDate = new Date(targetDate);
        endDate.setDate(endDate.getDate() + 1);

        if (period === '30d') {
            startDate.setDate(startDate.getDate() - 30);
        } else if (period === '365d') {
            startDate.setDate(startDate.getDate() - 365);
        }

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
                    gte: startDate,
                    lt: endDate
                }
            },
            include: {
                employee: {
                    select: {
                        fullName: true,
                        department: { select: { name: true } }
                    }
                }
            },
            orderBy: [{ date: 'desc' }, { clockIn: 'desc' }]
        });

        const config = await prisma.companyConfig.findUnique({
            where: { id: "default" },
            select: { lateGracePeriodMins: true }
        });
        const gracePeriod = config?.lateGracePeriodMins ?? 15;
        const baseStartHour = 8;
        const thresholdMins = baseStartHour * 60 + gracePeriod;

        const isLateLocal = (d: Date | null) => {
            if (!d) return false;
            // Use local OS timezone hours and minutes
            const h = d.getHours();
            const m = d.getMinutes();
            const minsSinceStartOfDay = h * 60 + m;
            return minsSinceStartOfDay > thresholdMins;
        };

        const presentCount = attendances.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
        const autoLateCount = attendances.filter(a => isLateLocal(a.clockIn)).length;

        const leaves = await prisma.leaveRequest.count({
            where: {
                status: 'APPROVED',
                startDate: { lte: endDate },
                endDate: { gte: startDate }
            }
        });

        const absentCount = period === 'today' ? totalActive - presentCount - leaves : 0;

        const formatTime = (d: Date | null) => {
            if (!d) return "-";
            const timeStr = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            if (period === 'today') return timeStr;
            return `${d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })} ${timeStr}`;
        };

        const todayList = attendances.map(a => {
            // Re-determine lateness for the table
            const isLate = isLateLocal(a.clockIn);

            return {
                name: a.employee.fullName,
                department: a.employee.department?.name || "-",
                clockIn: formatTime(a.clockIn),
                clockOut: formatTime(a.clockOut),
                clockInLat: a.clockInLat ? Number(a.clockInLat) : null,
                clockInLng: a.clockInLng ? Number(a.clockInLng) : null,
                clockOutLat: a.clockOutLat ? Number(a.clockOutLat) : null,
                clockOutLng: a.clockOutLng ? Number(a.clockOutLng) : null,
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
