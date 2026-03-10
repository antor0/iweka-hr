import { z } from "zod";

export const CreateLeaveRequestSchema = z.object({
    employeeId: z.string().min(1, "Employee ID is required"),
    leaveTypeId: z.string().min(1, "Leave Type is required"),
    startDate: z.string().transform(str => new Date(str)),
    endDate: z.string().transform(str => new Date(str)),
    totalDays: z.number().min(0.5, "Must be at least 0.5 days"),
    reason: z.string().min(5, "Reason is required"),
    attachmentUrl: z.string().optional().nullable()
});

export const ApproveRejectLeaveSchema = z.object({
    status: z.enum(["APPROVED", "REJECTED"]),
});
