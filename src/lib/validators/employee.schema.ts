import { z } from "zod";
import { Gender, MaritalStatus, EmploymentStatus, EmploymentType } from "@prisma/client";

export const CreateEmployeeSchema = z.object({
    employeeNumber: z.string().min(1, "Employee number is required"),
    nik: z.string().min(16, "NIK must be at least 16 digits").max(16, "NIK must be at most 16 digits"),
    fullName: z.string().min(1, "Full name is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().optional(),
    dateOfBirth: z.string().transform((str) => new Date(str)).optional(),
    gender: z.nativeEnum(Gender).optional(),
    maritalStatus: z.nativeEnum(MaritalStatus).optional(),
    npwp: z.string().optional(),
    bpjsKesNumber: z.string().optional(),
    bpjsTkNumber: z.string().optional(),
    hireDate: z.string().transform((str) => new Date(str)),
    employmentStatus: z.nativeEnum(EmploymentStatus),
    employmentType: z.nativeEnum(EmploymentType),
    departmentId: z.string().optional(),
    positionId: z.string().optional(),
    gradeId: z.string().optional(),
    managerId: z.string().optional(),
    bankName: z.string().optional(),
    bankAccount: z.string().optional(),
});

export const UpdateEmployeeSchema = CreateEmployeeSchema.partial();
