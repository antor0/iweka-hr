import { prisma } from "@/lib/db/prisma";
import { CreateHolidaySchema, UpdateHolidaySchema } from "@/lib/validators/holiday.schema";
import { z } from "zod";

export class HolidayService {
    static async getHolidays(year: number) {
        return prisma.holiday.findMany({
            where: { year },
            orderBy: { date: "asc" }
        });
    }

    static async getHolidayDates(year: number) {
        const holidays = await this.getHolidays(year);
        const dates = new Set<string>();
        for (const h of holidays) {
            dates.add(h.date.toISOString().split("T")[0]);
        }
        return dates;
    }

    static async createHoliday(payload: z.infer<typeof CreateHolidaySchema>) {
        const existing = await prisma.holiday.findUnique({
            where: { date: payload.date }
        });
        
        if (existing) {
            throw new Error("A holiday already exists on this date");
        }

        return prisma.holiday.create({ data: payload });
    }

    static async updateHoliday(id: string, payload: z.infer<typeof UpdateHolidaySchema>) {
        if (payload.date) {
            const existing = await prisma.holiday.findFirst({
                where: { date: payload.date, NOT: { id } }
            });
            if (existing) {
                throw new Error("A holiday already exists on this date");
            }
        }
        
        return prisma.holiday.update({
            where: { id },
            data: payload
        });
    }

    static async deleteHoliday(id: string) {
        return prisma.holiday.delete({ where: { id } });
    }
}
