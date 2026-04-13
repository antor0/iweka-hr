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
                location: true,
                employees: { select: { id: true, fullName: true, position: { select: { title: true } }, workTimeModelId: true, workTimeModel: { select: { name: true, type: true } } } },
                approvalWorkflows: {
                    include: {
                        level1Approver: { select: { id: true, fullName: true } },
                        level2Approver: { select: { id: true, fullName: true } },
                    }
                },
                departmentWorkModels: {
                    include: {
                        workTimeModel: {
                            include: { schedules: true }
                        }
                    }
                }
            }
        });
    }

    static async getDepartmentWorkModels(departmentId: string) {
        return prisma.departmentWorkModel.findMany({
            where: { departmentId },
            include: {
                workTimeModel: {
                    include: { schedules: true }
                }
            }
        });
    }

    static async assignWorkModel(departmentId: string, workTimeModelId: string) {
        const existing = await prisma.departmentWorkModel.findUnique({
            where: { departmentId_workTimeModelId: { departmentId, workTimeModelId } }
        });
        if (existing) throw new Error("Work model already assigned to this department");

        return prisma.departmentWorkModel.create({
            data: { departmentId, workTimeModelId }
        });
    }

    static async removeWorkModel(departmentId: string, workTimeModelId: string) {
        const employeesUsingModel = await prisma.employee.count({
            where: { departmentId, workTimeModelId }
        });
        if (employeesUsingModel > 0) {
            throw new Error(`Cannot remove work model: ${employeesUsingModel} employees are still assigned to it.`);
        }

        return prisma.departmentWorkModel.delete({
            where: { departmentId_workTimeModelId: { departmentId, workTimeModelId } }
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

        // Only set relation IDs to null if they were explicitly cleared (empty string)
        // If they are undefined (not in the payload), they will be preserved by Prisma
        const data: any = { ...payload };
        
        if (payload.locationId === "") data.locationId = null;
        if (payload.parentId === "") data.parentId = null;
        if (payload.headId === "") data.headId = null;

        // Ensure we don't accidentally pass unwanted fields from the client
        // This also helps with the Turbopack "Unknown arg" error by being explicit
        return prisma.department.update({
            where: { id },
            data: {
                name: data.name,
                code: data.code,
                isActive: data.isActive,
                description: data.description,
                locationId: data.locationId,
                parentId: data.parentId,
                headId: data.headId,
            }
        });
    }

    static async deleteDepartment(id: string) {
        // Can only delete if no employees, positions, or children are attached
        const department = await prisma.department.findUnique({
            where: { id },
            include: { 
                _count: { 
                    select: { 
                        employees: true, 
                        children: true,
                        positions: true
                    } 
                } 
            }
        });

        if (!department) throw new Error("Not found");
        if (department._count.employees > 0) throw new Error("Cannot delete department with assigned employees");
        if (department._count.children > 0) throw new Error("Cannot delete department with sub-departments");
        if (department._count.positions > 0) throw new Error("Cannot delete department with defined positions");

        return prisma.department.delete({ where: { id } });
    }
}
