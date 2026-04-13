import { z } from "zod";

export const CreateDepartmentSchema = z.object({
    name: z.string().min(1, "Name is required"),
    code: z.string().min(1, "Code is required"),
    parentId: z.string().optional().nullable(),
    headId: z.string().optional().nullable(),
    locationId: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    isActive: z.boolean().default(true),
});

export const UpdateDepartmentSchema = CreateDepartmentSchema.partial();
