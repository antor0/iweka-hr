import { z } from "zod";

export const BpjsConfigSchema = z.object({
    effectiveDate: z.string().or(z.date()).transform((str) => new Date(str)),
    kesEmployeeRate: z.coerce.number().min(0).max(1),
    kesCompanyRate: z.coerce.number().min(0).max(1),
    kesSalaryCap: z.coerce.number().min(0),
    jhtEmployeeRate: z.coerce.number().min(0).max(1),
    jhtCompanyRate: z.coerce.number().min(0).max(1),
    jkkCompanyRate: z.coerce.number().min(0).max(1),
    jkmCompanyRate: z.coerce.number().min(0).max(1),
    jpEmployeeRate: z.coerce.number().min(0).max(1),
    jpCompanyRate: z.coerce.number().min(0).max(1),
    jpSalaryCap: z.coerce.number().min(0),
    isActive: z.boolean().default(true),
});
