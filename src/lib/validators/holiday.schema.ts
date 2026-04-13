import { z } from "zod";

export const CreateHolidaySchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    date: z.string().or(z.date()).transform(val => new Date(val)),
    year: z.number().int().min(2000).max(2100),
    isNational: z.boolean().default(true),
    description: z.string().optional().nullable(),
});

export const UpdateHolidaySchema = CreateHolidaySchema.partial();
