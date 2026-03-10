import { prisma } from "@/lib/db/prisma";
import { CreateEmployeeSchema, UpdateEmployeeSchema } from "@/lib/validators/employee.schema";
import { z } from "zod";
import { EmployeeChangeType } from "@prisma/client";
import { AuditService } from "./audit.service";

export class EmployeeService {
    static async getEmployees(page = 1, limit = 10, search?: string, status?: string) {
        const skip = (page - 1) * limit;

        const baseFilter: any = {};
        if (status && status !== 'all') {
            if (status === 'active') baseFilter.employmentStatus = 'ACTIVE';
            else if (status === 'probation') baseFilter.employmentStatus = 'PROBATION';
            else if (status === 'resigned') baseFilter.employmentStatus = { in: ['RESIGNED', 'TERMINATED'] };
            else baseFilter.employmentStatus = status.toUpperCase();
        }

        const where = {
            ...baseFilter,
            ...(search ? {
                OR: [
                    { fullName: { contains: search, mode: "insensitive" as const } },
                    { employeeNumber: { contains: search, mode: "insensitive" as const } },
                    { email: { contains: search, mode: "insensitive" as const } },
                    { department: { name: { contains: search, mode: "insensitive" as const } } }
                ]
            } : {})
        };

        const [data, total] = await Promise.all([
            prisma.employee.findMany({
                where,
                skip,
                take: limit,
                include: {
                    department: { select: { name: true } },
                    position: { select: { title: true } },
                    grade: { select: { name: true } },
                },
                orderBy: { hireDate: "desc" }
            }),
            prisma.employee.count({ where })
        ]);

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    static async getEmployeeById(id: string) {
        return prisma.employee.findUnique({
            where: { id },
            include: {
                department: true,
                position: true,
                grade: true,
                manager: { select: { fullName: true, employeeNumber: true } },
            }
        });
    }

    static async createEmployee(payload: z.infer<typeof CreateEmployeeSchema>, currentUserId?: string) {
        // Enforce uniqueness
        const existing = await prisma.employee.findFirst({
            where: {
                OR: [
                    { employeeNumber: payload.employeeNumber },
                    { email: payload.email },
                    { nik: payload.nik }
                ]
            }
        });

        if (existing) {
            throw new Error("Employee with this Number, Email, or NIK already exists");
        }

        let validApproverId: string | undefined = undefined;
        if (currentUserId) {
            const approver = await prisma.employee.findUnique({ select: { id: true }, where: { id: currentUserId } });
            if (approver) validApproverId = currentUserId;
        }

        // Use transaction to create employee and initial employment history log
        return prisma.$transaction(async (tx) => {
            const employee = await tx.employee.create({
                data: payload
            });

            await tx.employmentHistory.create({
                data: {
                    employeeId: employee.id,
                    changeType: EmployeeChangeType.STATUS_CHANGE,
                    effectiveDate: payload.hireDate, // Assuming payload.hireDate is Date due to zod transform
                    oldValue: {},
                    newValue: { ...payload },
                    reason: "Initial Hire",
                    approvedById: validApproverId // System/HR who created this (fallback to null if not found)
                }
            });

            if (validApproverId) {
                // Background async logging
                AuditService.log(
                    validApproverId,
                    "CREATE",
                    "Employee",
                    employee.id,
                    null,
                    payload
                );
            }

            return employee;
        });
    }

    static async updateEmployee(id: string, payload: z.infer<typeof UpdateEmployeeSchema>, currentUserId?: string) {
        const existingEmployee = await prisma.employee.findUnique({ where: { id } });
        if (!existingEmployee) {
            throw new Error("Employee not found");
        }

        let validApproverId: string | undefined = undefined;
        if (currentUserId) {
            const approver = await prisma.employee.findUnique({ select: { id: true }, where: { id: currentUserId } });
            if (approver) validApproverId = currentUserId;
        }

        return prisma.$transaction(async (tx) => {
            const employee = await tx.employee.update({
                where: { id },
                data: payload
            });

            // Log the change
            await tx.employmentHistory.create({
                data: {
                    employeeId: id,
                    changeType: EmployeeChangeType.STATUS_CHANGE, // Or determine based on changes
                    effectiveDate: new Date(),
                    oldValue: existingEmployee as any,
                    newValue: employee as any,
                    reason: "Profile Update",
                    approvedById: validApproverId
                }
            });

            if (validApproverId) {
                AuditService.log(
                    validApproverId,
                    "UPDATE",
                    "Employee",
                    employee.id,
                    existingEmployee,
                    payload
                );
            }

            return employee;
        });
    }

    static async deleteEmployee(id: string) {
        // Warning: Soft delete is preferred in HRIS due to history.
        // For hard delete (e.g., mistaken entry) we just use delete.
        return prisma.employee.delete({
            where: { id }
        });
    }
}
