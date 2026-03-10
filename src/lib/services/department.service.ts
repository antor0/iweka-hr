import { prisma } from "@/lib/db/prisma";
import { CreateDepartmentSchema, UpdateDepartmentSchema } from "@/lib/validators/department.schema";
import { z } from "zod";

export class DepartmentService {
    static async getDepartments(search?: string) {
        const where = search ? {
            OR: [
                { name: { contains: search, mode: "insensitive" as const } },
                { code: { contains: search, mode: "insensitive" as const } },
            ]
        } : {};

        return prisma.department.findMany({
            where,
            include: {
                head: { select: { fullName: true, employeeNumber: true } },
                parent: { select: { name: true } },
                _count: { select: { employees: true } },
            },
            orderBy: { name: "asc" }
        });
    }

    static async getDepartmentById(id: string) {
        return prisma.department.findUnique({
            where: { id },
            include: {
                head: true,
                parent: true,
                children: true,
                positions: true,
                employees: { select: { id: true, fullName: true, position: { select: { title: true } } } }
            }
        });
    }

    static async createDepartment(payload: z.infer<typeof CreateDepartmentSchema>) {
        const existing = await prisma.department.findUnique({
            where: { code: payload.code }
        });

        if (existing) {
            throw new Error("Department with this code already exists");
        }

        return prisma.department.create({
            data: payload
        });
    }

    static async updateDepartment(id: string, payload: z.infer<typeof UpdateDepartmentSchema>) {
        if (payload.code) {
            const existing = await prisma.department.findFirst({
                where: { code: payload.code, NOT: { id } }
            });
            if (existing) throw new Error("Department code already taken");
        }

        return prisma.department.update({
            where: { id },
            data: payload
        });
    }

    static async deleteDepartment(id: string) {
        // Can only delete if no employees are attached
        const department = await prisma.department.findUnique({
            where: { id },
            include: { _count: { select: { employees: true, children: true } } }
        });

        if (!department) throw new Error("Not found");
        if (department._count.employees > 0) throw new Error("Cannot delete department with assigned employees");
        if (department._count.children > 0) throw new Error("Cannot delete department with sub-departments");

        return prisma.department.delete({ where: { id } });
    }
}
