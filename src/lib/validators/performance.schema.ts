import { z } from "zod";

export const CreateCycleSchema = z.object({
    name: z.string().min(3),
    description: z.string().optional(),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
});

export const CreateAppraisalSchema = z.object({
    cycleId: z.string().uuid(),
    employeeId: z.string().uuid(),
    managerId: z.string().uuid(),
});

export const CreateGoalSchema = z.object({
    title: z.string().min(3),
    description: z.string(),
    weight: z.number().min(0).max(100),
});

export const UpdateAppraisalStatusSchema = z.object({
    status: z.enum(["DRAFT", "SELF_ASSESSMENT", "MANAGER_ASSESSMENT", "REVIEW", "COMPLETED", "CANCELLED"]),
    selfScore: z.number().optional(),
    managerScore: z.number().optional(),
    summaryFeedback: z.string().optional()
});

export const UpdateGoalSchema = z.object({
    status: z.string().optional(),
    selfRating: z.number().min(1).max(5).optional(),
    managerRating: z.number().min(1).max(5).optional(),
    feedback: z.string().optional()
});
