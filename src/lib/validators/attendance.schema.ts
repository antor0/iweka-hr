import { z } from "zod";
import { AttendanceStatus, AttendanceSource } from "@prisma/client";

export const CreateAttendanceSchema = z.object({
    employeeId: z.string().min(1, "Employee ID is required"),
    date: z.string().transform((str) => new Date(str)),
    clockIn: z.string().transform((str) => new Date(str)).optional().nullable(),
    clockOut: z.string().transform((str) => new Date(str)).optional().nullable(),
    status: z.nativeEnum(AttendanceStatus).default("PRESENT"),
    source: z.nativeEnum(AttendanceSource).default("WEB"),
    notes: z.string().optional().nullable(),
});

export const UpdateAttendanceSchema = CreateAttendanceSchema.partial();

export const ClockInSchema = z.object({
    employeeId: z.string().min(1),
    time: z.string().transform(str => new Date(str)),
    source: z.nativeEnum(AttendanceSource).default("WEB"),
    notes: z.string().optional(),
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional()
});

export const ClockOutSchema = z.object({
    employeeId: z.string().min(1),
    time: z.string().transform(str => new Date(str)),
    notes: z.string().optional(),
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional()
});
