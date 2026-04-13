import { z } from "zod";

export const GenerateScheduleSchema = z.object({
    month: z.number().int().min(1).max(12),
    year: z.number().int().min(2000).max(2100)
});

export const OverrideScheduleSchema = z.object({
    shiftName: z.string().min(1),
    scheduledStart: z.string().regex(/^\d{2}:\d{2}$/, "Must be HH:mm"),
    scheduledEnd: z.string().regex(/^\d{2}:\d{2}$/, "Must be HH:mm"),
});
