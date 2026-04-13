import { prisma } from "@/lib/db/prisma";
import { TimesheetStatus } from "@prisma/client";

export class TimesheetService {
    static async getTimesheets(departmentId: string, month: number, year: number) {
        const startDate = new Date(Date.UTC(year, month - 1, 1));
        const endDate = new Date(Date.UTC(year, month, 1));

        return prisma.timesheet.findMany({
            where: {
                employee: { departmentId },
                date: {
                    gte: startDate,
                    lt: endDate
                }
            },
            include: {
                employee: { select: { fullName: true, employeeNumber: true } }
            },
            orderBy: [{ employee: { fullName: "asc" } }, { date: "asc" }]
        });
    }

    static async generateTimesheets(departmentId: string, month: number, year: number) {
        const startOfMonth = new Date(Date.UTC(year, month - 1, 1));
        const endOfMonth = new Date(Date.UTC(year, month, 1));

        const department = await prisma.department.findUnique({
            where: { id: departmentId },
            include: { employees: { select: { id: true, workTimeModelId: true } } }
        });

        if (!department) throw new Error("Department not found");

        const employees = department.employees;
        if (employees.length === 0) return 0;

        const employeeIds = employees.map(e => e.id);

        // Fetch Schedule
        const schedules = await prisma.employeeWorkSchedule.findMany({
            where: {
                employeeId: { in: employeeIds },
                date: { gte: startOfMonth, lt: endOfMonth }
            }
        });

        if (schedules.length === 0) throw new Error("No schedules found for this month. Please generate schedules first.");

        // Fetch Attendance
        const attendances = await prisma.attendance.findMany({
            where: {
                employeeId: { in: employeeIds },
                date: { gte: startOfMonth, lt: endOfMonth }
            }
        });

        // Group attendance by date str
        const attendanceMap: Record<string, Record<string, any>> = {};
        for (const a of attendances) {
            const d = new Date(a.date);
            const dateStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
            if (!attendanceMap[a.employeeId]) attendanceMap[a.employeeId] = {};
            attendanceMap[a.employeeId][dateStr] = a;
        }

        // Fetch Leaves (approved)
        const leaves = await prisma.leaveRequest.findMany({
            where: {
                employeeId: { in: employeeIds },
                status: "APPROVED",
                startDate: { lt: endOfMonth },
                endDate: { gte: startOfMonth }
            }
        });

        // Clear existing timesheets for these specific employees
        await prisma.timesheet.deleteMany({
            where: {
                employeeId: { in: employeeIds },
                date: { gte: startOfMonth, lt: endOfMonth }
            }
        });

        const newTimesheets = [];

        for (const sch of schedules) {
            const schDate = new Date(sch.date);
            const dateStr = `${schDate.getUTCFullYear()}-${String(schDate.getUTCMonth() + 1).padStart(2, '0')}-${String(schDate.getUTCDate()).padStart(2, '0')}`;
            
            let status: TimesheetStatus = TimesheetStatus.ABSENT;
            const att = attendanceMap[sch.employeeId]?.[dateStr];

            // 1. Check Leave
            const onLeave = leaves.some(l => {
                const ls = new Date(l.startDate);
                const le = new Date(l.endDate);
                return schDate >= ls && schDate <= le;
            });

            if (onLeave) {
                status = TimesheetStatus.LEAVE;
            } else if (sch.isHoliday || sch.shiftName === "Holiday") {
                status = TimesheetStatus.HOLIDAY;
            } else if (sch.shiftName === "Off" || sch.shiftName === "OFF") {
                status = TimesheetStatus.OFF_DAY;
            } else {
                // Determine if Present, Late, or Absent based on attendance
                if (att && att.clockIn) {
                    // check if late
                    const clockInTime = new Date(att.clockIn);
                    const [sh, sm] = sch.scheduledStart.split(":").map(Number);
                    
                    const scheduledDate = new Date(schDate);
                    scheduledDate.setHours(sh, sm, 0, 0);

                    // Allow 15 min grace period
                    scheduledDate.setMinutes(scheduledDate.getMinutes() + 15);

                    if (clockInTime > scheduledDate) {
                        status = TimesheetStatus.LATE;
                    } else {
                        status = TimesheetStatus.PRESENT;
                    }
                } else {
                    status = TimesheetStatus.ABSENT;
                }
            }

            newTimesheets.push({
                employeeId: sch.employeeId,
                date: schDate,
                month: month,
                year: year,
                scheduledStart: sch.scheduledStart,
                scheduledEnd: sch.scheduledEnd,
                actualClockIn: att?.clockIn ? new Date(att.clockIn) : null,
                actualClockOut: att?.clockOut ? new Date(att.clockOut) : null,
                status
            });
        }

        if (newTimesheets.length > 0) {
            await prisma.timesheet.createMany({ data: newTimesheets });
        }

        return newTimesheets.length;
    }
}
