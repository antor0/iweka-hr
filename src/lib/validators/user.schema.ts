import { z } from "zod";
import { UserRole } from "@prisma/client";

export const CreateUserSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    role: z.nativeEnum(UserRole),
    employeeId: z.string().uuid("Invalid employee ID").optional().nullable(),
    isActive: z.boolean().default(true),
});

export const UpdateUserSchema = z.object({
    email: z.string().email("Invalid email address").optional(),
    role: z.nativeEnum(UserRole).optional(),
    employeeId: z.string().uuid("Invalid employee ID").optional().nullable(),
    isActive: z.boolean().optional(),
});

export const ResetUserPasswordSchema = z.object({
    password: z.string().min(8, "Password must be at least 8 characters long"),
});

export const ChangePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters long"),
    confirmPassword: z.string().min(8, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

export type CreateUserRequest = z.infer<typeof CreateUserSchema>;
export type UpdateUserRequest = z.infer<typeof UpdateUserSchema>;
export type ChangePasswordRequest = z.infer<typeof ChangePasswordSchema>;
