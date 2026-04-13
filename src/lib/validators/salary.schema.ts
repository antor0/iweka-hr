import { z } from "zod";
import { AllowanceCategory, AllowanceBasis } from "@prisma/client";

export const EmployeeAllowanceSchema = z.object({
    name: z.string().min(2, "Name is required"),
    category: z.nativeEnum(AllowanceCategory),
    basis: z.nativeEnum(AllowanceBasis).default(AllowanceBasis.FIXED_AMOUNT),
    amount: z.number().min(0, "Amount must be a positive number"),
    isActive: z.boolean().default(true),
});

export const MonthlyVariableInputSchema = z.object({
    month: z.number().int().min(1).max(12),
    year: z.number().int().min(2000),
    thrAmount: z.number().min(0).default(0),
    overtimeAmount: z.number().min(0).default(0),
    commissionAmount: z.number().min(0).default(0),
    bonusAmount: z.number().min(0).default(0),
    notes: z.string().optional().nullable(),
});
