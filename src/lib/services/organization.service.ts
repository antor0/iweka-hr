import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import {
    LocationSchema,
    WorkTimeModelSchema,
    ApprovalWorkflowSchema,
    PositionGradeSchema,
} from "../validators/organization.schema";

export class OrganizationService {
    // ----------------------------------------------------------------------
    // LOCATIONS
    // ----------------------------------------------------------------------
    static async getLocations() {
        return prisma.location.findMany({
            orderBy: { name: "asc" },
            include: {
                _count: {
                    select: { departments: true, employees: true },
                },
            },
        });
    }

    static async createLocation(payload: z.infer<typeof LocationSchema>) {
        return prisma.location.create({ data: payload });
    }

    static async updateLocation(id: string, payload: z.infer<typeof LocationSchema>) {
        return prisma.location.update({ where: { id }, data: payload });
    }

    static async deleteLocation(id: string) {
        return prisma.location.delete({ where: { id } });
    }

    // ----------------------------------------------------------------------
    // WORK TIME MODELS
    // ----------------------------------------------------------------------
    static async getWorkTimeModels() {
        return prisma.workTimeModel.findMany({
            orderBy: { name: "asc" },
            include: {
                schedules: true,
                _count: {
                    select: { departments: true, employees: true },
                },
            },
        });
    }

    static async createWorkTimeModel(payload: z.infer<typeof WorkTimeModelSchema>) {
        return prisma.$transaction(async (tx) => {
            const model = await tx.workTimeModel.create({
                data: {
                    name: payload.name,
                    type: payload.type,
                    isActive: payload.isActive,
                },
            });

            if (payload.schedules && payload.schedules.length > 0) {
                await tx.workTimeSchedule.createMany({
                    data: payload.schedules.map((s) => ({
                        workTimeModelId: model.id,
                        shiftName: s.shiftName,
                        startTime: s.startTime,
                        endTime: s.endTime,
                        breakMinutes: s.breakMinutes,
                    })),
                });
            }

            return tx.workTimeModel.findUnique({
                where: { id: model.id },
                include: { schedules: true },
            });
        });
    }

    static async updateWorkTimeModel(id: string, payload: z.infer<typeof WorkTimeModelSchema>) {
        return prisma.$transaction(async (tx) => {
            await tx.workTimeModel.update({
                where: { id },
                data: {
                    name: payload.name,
                    type: payload.type,
                    isActive: payload.isActive,
                },
            });

            // Re-create all schedules
            await tx.workTimeSchedule.deleteMany({ where: { workTimeModelId: id } });
            if (payload.schedules && payload.schedules.length > 0) {
                await tx.workTimeSchedule.createMany({
                    data: payload.schedules.map((s) => ({
                        workTimeModelId: id,
                        shiftName: s.shiftName,
                        startTime: s.startTime,
                        endTime: s.endTime,
                        breakMinutes: s.breakMinutes,
                    })),
                });
            }

            return tx.workTimeModel.findUnique({
                where: { id },
                include: { schedules: true },
            });
        });
    }

    static async deleteWorkTimeModel(id: string) {
        const model = await prisma.workTimeModel.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { departments: true, employees: true }
                }
            }
        });

        if (!model) throw new Error("Work time model not found");
        
        if (model._count.departments > 0) {
            throw new Error(`Cannot delete work model "${model.name}" because it is assigned to ${model._count.departments} department(s).`);
        }
        
        if (model._count.employees > 0) {
            throw new Error(`Cannot delete work model "${model.name}" because it is assigned to ${model._count.employees} employee(s).`);
        }

        return prisma.workTimeModel.delete({ where: { id } });
    }

    // ----------------------------------------------------------------------
    // APPROVAL WORKFLOWS
    // ----------------------------------------------------------------------
    static async getApprovalWorkflows() {
        return prisma.approvalWorkflow.findMany({
            include: {
                department: { select: { id: true, name: true, code: true } },
                level1Approver: { select: { id: true, fullName: true, employeeNumber: true } },
                level2Approver: { select: { id: true, fullName: true, employeeNumber: true } },
            },
            orderBy: { department: { name: "asc" } },
        });
    }

    static async upsertApprovalWorkflow(payload: z.infer<typeof ApprovalWorkflowSchema>) {
        return prisma.approvalWorkflow.upsert({
            where: {
                departmentId_approvalType: {
                    departmentId: payload.departmentId,
                    approvalType: payload.approvalType,
                },
            },
            update: {
                level1ApproverId: payload.level1ApproverId,
                level2ApproverId: payload.level2ApproverId || null,
                isActive: payload.isActive,
            },
            create: {
                departmentId: payload.departmentId,
                approvalType: payload.approvalType,
                level1ApproverId: payload.level1ApproverId,
                level2ApproverId: payload.level2ApproverId || null,
                isActive: payload.isActive,
            },
        });
    }

    static async bulkUpsertApprovalWorkflows(departmentId: string, level1ApproverId: string) {
        // Automatically create/update all 5 types using Level 1 ONLY as requested
        const types: ("LEAVE" | "OVERTIME" | "CLAIM" | "BUDGETING" | "RECRUITMENT")[] = [
            "LEAVE", "OVERTIME", "CLAIM", "BUDGETING", "RECRUITMENT"
        ];

        return prisma.$transaction(
            types.map((type) =>
                prisma.approvalWorkflow.upsert({
                    where: {
                        departmentId_approvalType: {
                            departmentId,
                            approvalType: type,
                        },
                    },
                    update: {
                        level1ApproverId,
                        isActive: true,
                    },
                    create: {
                        departmentId,
                        approvalType: type,
                        level1ApproverId,
                        isActive: true,
                    },
                })
            )
        );
    }

    static async deleteApprovalWorkflow(id: string) {
        return prisma.approvalWorkflow.delete({ where: { id } });
    }

    // ----------------------------------------------------------------------
    // POSITION & GRADE MAPPING
    // ----------------------------------------------------------------------
    static async getPositionGrades() {
        return prisma.positionGrade.findMany({
            include: {
                position: true,
                grade: true,
            },
            orderBy: [
                { position: { title: "asc" } },
                { grade: { level: "asc" } }
            ]
        });
    }

    static async getPositionsWithGrades() {
        return prisma.position.findMany({
            include: {
                positionGrades: {
                    include: { grade: true }
                }
            },
            orderBy: { title: "asc" }
        });
    }

    static async upsertPositionGrades(payload: z.infer<typeof PositionGradeSchema>) {
        return prisma.$transaction(async (tx) => {
            // First drop existing mapped grades for this position
            await tx.positionGrade.deleteMany({
                where: { positionId: payload.positionId }
            });

            // Re-insert new selected grades
            if (payload.gradeIds && payload.gradeIds.length > 0) {
                await tx.positionGrade.createMany({
                    data: payload.gradeIds.map(gradeId => ({
                        positionId: payload.positionId,
                        gradeId
                    }))
                });
            }

            return tx.position.findUnique({
                where: { id: payload.positionId },
                include: { positionGrades: { include: { grade: true } } }
            });
        });
    }
}
