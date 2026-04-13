import { z } from "zod";
import { ApprovalType, WorkTimeModelType } from "@prisma/client";

// Core Department Schema (To preserve existing schema compatibility)
export const DepartmentSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    code: z.string().min(2, "Code must be at least 2 characters"),
    parentId: z.string().optional().nullable(),
    headId: z.string().optional().nullable(),
    locationId: z.string().optional().nullable(),
    workTimeModelId: z.string().optional().nullable(),
});

export const LocationSchema = z.object({
    name: z.string().min(2, "Name is required"),
    address: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    isActive: z.boolean().default(true),
});

export const WorkTimeScheduleSchema = z.object({
    id: z.string().optional(),
    shiftName: z.string().min(1, "Shift name is required"),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Start time must be HH:MM"),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "End time must be HH:MM"),
    breakMinutes: z.number().int().min(0).default(60),
});

export const WorkTimeModelSchema = z.object({
    name: z.string().min(2, "Name is required"),
    type: z.nativeEnum(WorkTimeModelType).default(WorkTimeModelType.REGULAR),
    isActive: z.boolean().default(true),
    schedules: z.array(WorkTimeScheduleSchema).min(1, "At least one schedule is required"),
});

export const ApprovalWorkflowSchema = z.object({
    departmentId: z.string().min(1, "Department is required"),
    approvalType: z.nativeEnum(ApprovalType),
    level1ApproverId: z.string().min(1, "Level 1 Approver is required"),
    level2ApproverId: z.string().optional().nullable(),
    isActive: z.boolean().default(true),
});

export const PositionGradeSchema = z.object({
    positionId: z.string().min(1, "Position is required"),
    gradeIds: z.array(z.string()).min(1, "At least one grade must be selected"),
});
