import { z } from "zod";
import { RequisitionStatus, ApplicationStatus } from "@prisma/client";

export const CreateRequisitionSchema = z.object({
    title: z.string().min(3),
    departmentId: z.string().uuid(),
    positionId: z.string().uuid(),
    headcount: z.coerce.number().min(1).default(1),
    location: z.string().optional(),
    targetDate: z.coerce.date().optional(),
    description: z.string().min(10),
    requirements: z.string().min(10),
    status: z.nativeEnum(RequisitionStatus).optional(),
});

export const CreateCandidateSchema = z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
    source: z.string().optional(),
    resumeUrl: z.string().url().optional().or(z.literal('')),
    portfolioUrl: z.string().url().optional().or(z.literal(''))
});

export const CreateApplicationSchema = z.object({
    requisitionId: z.string().uuid(),
    candidateId: z.string().uuid(),
    expectedSalary: z.coerce.number().optional(),
    notes: z.string().optional()
});
