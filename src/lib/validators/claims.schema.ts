import { z } from "zod";

export const CreateClaimSchema = z.object({
    employeeId: z.string().min(1, "Employee ID is required"),
    title: z.string().min(3, "Title must be at least 3 characters"),
    description: z.string().optional().nullable(),
});

export const AddClaimItemSchema = z.object({
    category: z.enum([
        "TRAVEL", "MEALS", "ACCOMMODATION", "TRANSPORT",
        "PARKING_TOLLS", "OFFICE_SUPPLIES", "COMMUNICATION", "OTHER"
    ]),
    description: z.string().min(1, "Description is required"),
    amount: z.number().min(0, "Amount must be positive"),
    receiptDate: z.string().transform(str => new Date(str)),
    merchant: z.string().optional().nullable(),
    receiptUrl: z.string().optional().nullable(),
    ocrRawText: z.string().optional().nullable(),
});

export const ProcessClaimSchema = z.object({
    status: z.enum(["APPROVED", "REJECTED"]),
    rejectReason: z.string().optional().nullable(),
});
