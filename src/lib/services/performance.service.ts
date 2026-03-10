import { prisma } from "@/lib/db/prisma";
import { AuditService } from "./audit.service";

export class PerformanceService {
    // Cycles
    static async getCycles() {
        return prisma.performanceCycle.findMany({
            orderBy: { startDate: 'desc' }
        });
    }

    static async createCycle(data: any, currentUserId?: string) {
        return prisma.$transaction(async (tx) => {
            const cycle = await tx.performanceCycle.create({
                data: {
                    name: data.name,
                    description: data.description,
                    startDate: new Date(data.startDate),
                    endDate: new Date(data.endDate),
                }
            });

            if (currentUserId) {
                AuditService.log(currentUserId, "CREATE", "PerformanceCycle", cycle.id, null, data);
            }
            return cycle;
        });
    }

    // Appraisals
    static async getAppraisalsByCycle(cycleId: string, employeeId?: string, managerId?: string) {
        const where: any = { cycleId };
        if (employeeId) where.employeeId = employeeId;
        if (managerId) where.managerId = managerId;

        return prisma.appraisal.findMany({
            where,
            include: {
                employee: { select: { fullName: true, department: { select: { name: true } }, position: { select: { title: true } } } },
                manager: { select: { fullName: true } },
                goals: true,
                cycle: true
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    static async getAppraisal(id: string) {
        return prisma.appraisal.findUnique({
            where: { id },
            include: {
                employee: { select: { fullName: true, department: { select: { name: true } }, position: { select: { title: true } } } },
                manager: { select: { fullName: true } },
                goals: true,
                cycle: true
            }
        });
    }

    static async createAppraisal(data: any, currentUserId?: string) {
        return prisma.$transaction(async (tx) => {
            const appraisal = await tx.appraisal.create({
                data: {
                    cycleId: data.cycleId,
                    employeeId: data.employeeId,
                    managerId: data.managerId,
                }
            });
            if (currentUserId) {
                AuditService.log(currentUserId, "CREATE", "Appraisal", appraisal.id, null, data);
            }
            return appraisal;
        });
    }

    static async updateAppraisalStatus(id: string, data: any, currentUserId?: string) {
        return prisma.$transaction(async (tx) => {
            const existing = await tx.appraisal.findUnique({ where: { id } });
            if (!existing) throw new Error("Appraisal not found");

            const updateData: any = { status: data.status };
            if (data.selfScore !== undefined) updateData.selfScore = data.selfScore;
            if (data.managerScore !== undefined) updateData.managerScore = data.managerScore;
            if (data.summaryFeedback !== undefined) updateData.summaryFeedback = data.summaryFeedback;

            // Simple average for final score if completed
            if (data.status === 'COMPLETED') {
                const s = data.selfScore || existing.selfScore || 0;
                const m = data.managerScore || existing.managerScore || 0;
                updateData.finalScore = (Number(s) + Number(m)) / 2;
            }

            const updated = await tx.appraisal.update({
                where: { id },
                data: updateData
            });

            if (currentUserId) {
                AuditService.log(currentUserId, "UPDATE", "Appraisal", id, existing, updateData);
            }
            return updated;
        });
    }

    // Goals
    static async createGoal(appraisalId: string, data: any, currentUserId?: string) {
        return prisma.$transaction(async (tx) => {
            const sumOfWeights = await tx.goal.aggregate({
                where: { appraisalId },
                _sum: { weight: true }
            });

            const currentTotal = sumOfWeights._sum.weight ? Number(sumOfWeights._sum.weight) : 0;
            if (currentTotal + Number(data.weight) > 100) {
                throw new Error("Total goal weights cannot exceed 100%");
            }

            const goal = await tx.goal.create({
                data: {
                    appraisalId,
                    title: data.title,
                    description: data.description,
                    weight: data.weight
                }
            });
            return goal;
        });
    }

    static async updateGoal(id: string, data: any, currentUserId?: string) {
        return prisma.$transaction(async (tx) => {
            const existing = await tx.goal.findUnique({ where: { id } });
            if (!existing) throw new Error("Goal not found");

            const updateData: any = {};
            if (data.status) updateData.status = data.status;
            if (data.selfRating !== undefined) updateData.selfRating = data.selfRating;
            if (data.managerRating !== undefined) updateData.managerRating = data.managerRating;
            if (data.feedback !== undefined) updateData.feedback = data.feedback;

            return tx.goal.update({
                where: { id },
                data: updateData
            });
        });
    }
}
