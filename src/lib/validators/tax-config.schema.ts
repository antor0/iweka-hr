import { z } from "zod";
import { TaxMethod } from "@prisma/client";

export const TaxConfigSchema = z.object({
    effectiveDate: z.string().or(z.date()).transform((str) => new Date(str)),
    method: z.nativeEnum(TaxMethod),
    brackets: z.array(z.object({
        max: z.coerce.number().nullable(),
        rate: z.coerce.number().min(0).max(1)
    })),
    ptkpValues: z.record(z.string(), z.coerce.number()),
    terRates: z.record(z.string(), z.array(z.object({
        min: z.coerce.number(),
        max: z.coerce.number().nullable(),
        rate: z.coerce.number().min(0).max(1)
    }))).optional().nullable(),
    isActive: z.boolean().default(true),
});
