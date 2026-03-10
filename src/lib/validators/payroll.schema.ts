import { z } from "zod";

export const GeneratePayrollSchema = z.object({
    periodMonth: z.number().min(1).max(12),
    periodYear: z.number().min(2000).max(2100),
    employeeIds: z.array(z.string()).optional(), // If empty, run for all active
});

export const UpdatePayrollStatusSchema = z.object({
    status: z.enum(["DRAFT", "CALCULATING", "REVIEW", "APPROVED", "FINALIZED", "DISBURSED"]),
});
