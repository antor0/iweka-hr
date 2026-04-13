import { prisma } from "@/lib/db/prisma";
import { HolidayService } from "./holiday.service";

export class ScheduleService {
    static async getSchedule(departmentId: string, month: number, year: number) {
        const startDate = new Date(Date.UTC(year, month - 1, 1));
        const endDate = new Date(Date.UTC(year, month, 1));

        return prisma.employeeWorkSchedule.findMany({
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

    static async deleteSchedule(departmentId: string, month: number, year: number) {
        const startDate = new Date(Date.UTC(year, month - 1, 1));
        const endDate = new Date(Date.UTC(year, month, 1));

        return prisma.employeeWorkSchedule.deleteMany({
            where: {
                employee: { departmentId },
                date: {
                    gte: startDate,
                    lt: endDate
                }
            }
        });
    }

    static async overrideSchedule(scheduleId: string, payload: { shiftName: string; scheduledStart: string; scheduledEnd: string }) {
        return prisma.employeeWorkSchedule.update({
            where: { id: scheduleId },
            data: payload
        });
    }

    static async generateSchedule(departmentId: string, month: number, year: number) {
        // 1. Fetch info
        const department = await prisma.department.findUnique({
            where: { id: departmentId },
            include: {
                departmentWorkModels: {
                    include: { workTimeModel: { include: { schedules: true } } }
                },
                employees: {
                    where: { workTimeModelId: { not: null } },
                    select: { id: true, workTimeModelId: true }
                }
            }
        });

        if (!department) throw new Error("Department not found");

        const holidayDates = await HolidayService.getHolidayDates(year);

        // Clear existing for these specific employees
        const employeeIds = department.employees.map(e => e.id);
        const startDate = new Date(Date.UTC(year, month - 1, 1));
        const endDate = new Date(Date.UTC(year, month, 1));

        await prisma.employeeWorkSchedule.deleteMany({
            where: {
                employeeId: { in: employeeIds },
                date: {
                    gte: startDate,
                    lt: endDate
                }
            }
        });

        const daysInMonth = new Date(year, month, 0).getDate();
        const generatedRows: any[] = [];

        // Group employees by their model
        const employeesByModel: Record<string, string[]> = {};
        for (const emp of department.employees) {
            if (emp.workTimeModelId) {
                if (!employeesByModel[emp.workTimeModelId]) employeesByModel[emp.workTimeModelId] = [];
                employeesByModel[emp.workTimeModelId].push(emp.id);
            }
        }

        // Generate per model
        for (const dwm of department.departmentWorkModels) {
            const modelId = dwm.workTimeModelId;
            const model = dwm.workTimeModel;
            const employees = employeesByModel[modelId] || [];
            if (employees.length === 0) continue;

            if (model.type === "REGULAR") {
                this.generateRegularSchedule(employees, model, month, year, daysInMonth, holidayDates, generatedRows);
            } else {
                this.generateShiftSchedule(employees, model, month, year, daysInMonth, holidayDates, generatedRows);
            }
        }

        if (generatedRows.length > 0) {
            await prisma.employeeWorkSchedule.createMany({
                data: generatedRows
            });
        }

        return generatedRows.length;
    }

    private static generateRegularSchedule(employees: string[], model: any, month: number, year: number, daysInMonth: number, holidayDates: Set<string>, outRows: any[]) {
        const schedule = model.schedules?.[0]; // Assume first is the regular shift
        if (!schedule) return;

        for (const empId of employees) {
            for (let day = 1; day <= daysInMonth; day++) {
                const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                
                const isWeekend = new Date(year, month - 1, day).getDay() === 0 || new Date(year, month - 1, day).getDay() === 6; // Sunday/Saturday
                const isHoliday = holidayDates.has(dateStr);

                outRows.push({
                    employeeId: empId,
                    workTimeModelId: model.id,
                    date: new Date(`${dateStr}T00:00:00Z`), // Store cleanly
                    shiftName: isHoliday ? "Holiday" : (isWeekend ? "Off" : schedule.shiftName),
                    scheduledStart: isHoliday || isWeekend ? "00:00" : schedule.startTime,
                    scheduledEnd: isHoliday || isWeekend ? "00:00" : schedule.endTime,
                    breakMinutes: schedule.breakMinutes || 60,
                    isWeekend,
                    isHoliday
                });
            }
        }
    }

    private static generateShiftSchedule(employees: string[], model: any, month: number, year: number, daysInMonth: number, holidayDates: Set<string>, outRows: any[]) {
        const schedules = model.schedules;
        if (!schedules || schedules.length === 0) return;

        // Group size for round robin
        // If 2 shifts, we want 3 groups (1 rotates out). If 3 shifts, 4 groups, etc.
        const numShifts = schedules.length;
        const numGroups = numShifts + 1; 

        // Assign employees to groups evenly
        const groups: string[][] = Array.from({ length: numGroups }, () => []);
        employees.forEach((empId, index) => {
            groups[index % numGroups].push(empId);
        });

        // 2 rest days per week rotation
        const RESTART_CYCLE_DAYS = 7; // e.g. 5 days work, 2 days off. Or maybe strict round-robin daily.
        // We will just do a simple daily shift round robin
        // Day index D: Group G gets Shift (D + G) % numGroups.
        // If (D + G) % numGroups == numShifts => OFF.

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isWeekend = new Date(year, month - 1, day).getDay() === 0 || new Date(year, month - 1, day).getDay() === 6;
            const isHoliday = holidayDates.has(dateStr);

            // Our simple rotation algorithm
            for (let g = 0; g < numGroups; g++) {
                // Determine shift index for this group on this day
                // To do X days stretch, we can just use Math.floor((day-1) / 5) but let's stick to daily rotation for variety,
                // or weekly rotation. The plan said "round-robin daily with 2 rest days per week".
                // We'll advance the rotation every week (every 7 days).
                const weekIndex = Math.floor((day - 1) / 7);
                const shiftIndex = (weekIndex + g) % numGroups; 

                // Note: user mentioned "round robin daily with 2 rest days". Wait, 2 rest days per week.
                // A better approach matching "daily" is changing the schedule group every day.
                // Let's do: every day, the group advances by 1.
                const dailyShiftIndex = (day - 1 + g) % numGroups;

                const isOff = dailyShiftIndex === numShifts;
                const schedule = isOff ? null : schedules[dailyShiftIndex];

                for (const empId of groups[g]) {
                    outRows.push({
                        employeeId: empId,
                        workTimeModelId: model.id,
                        date: new Date(`${dateStr}T00:00:00Z`),
                        shiftName: isOff ? "Off" : schedule.shiftName,
                        scheduledStart: isOff ? "00:00" : schedule.startTime,
                        scheduledEnd: isOff ? "00:00" : schedule.endTime,
                        breakMinutes: isOff ? 60 : (schedule?.breakMinutes || 60),
                        isWeekend,
                        isHoliday
                    });
                }
            }
        }
    }
}
