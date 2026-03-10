import { prisma } from "@/lib/db/prisma";
import { CreateLeaveRequestSchema } from "@/lib/validators/leave.schema";
import { z } from "zod";
import { RequestStatus } from "@prisma/client";

export class LeaveService {
    static async getLeaveRequests(page = 1, limit = 10, employeeId?: string, status?: RequestStatus) {
        const skip = (page - 1) * limit;

        const where: any = {};
        if (employeeId) where.employeeId = employeeId;
        if (status) where.status = status;

        const [data, total] = await Promise.all([
            prisma.leaveRequest.findMany({
                where,
                skip,
                take: limit,
                include: {
                    employee: { select: { fullName: true, employeeNumber: true } },
                    leaveType: { select: { name: true, code: true } }
                },
                orderBy: { startDate: "desc" }
            }),
            prisma.leaveRequest.count({ where })
        ]);

        return {
            data,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
        };
    }

    static async getLeaveRequestById(id: string) {
        return prisma.leaveRequest.findUnique({
            where: { id },
            include: {
                employee: { select: { fullName: true, managerId: true } },
                leaveType: true,
                approvedBy: { select: { fullName: true } }
            }
        });
    }

    static async getLeaveBalances(employeeId: string, year: number) {
        return prisma.leaveBalance.findMany({
            where: { employeeId, year },
            include: { leaveType: true }
        });
    }

    static async createLeaveRequest(payload: z.infer<typeof CreateLeaveRequestSchema>) {
        const currentYear = payload.startDate.getFullYear();

        // Check if there's enough balance for this type
        // Wait, not all leave types have bounded balances (e.g. sick leave might be unlimited)
        // Check leave type first
        const leaveType = await prisma.leaveType.findUnique({ where: { id: payload.leaveTypeId } });
        if (!leaveType) throw new Error("Invalid leave type");

        if (leaveType.annualEntitlement > 0 && leaveType.annualEntitlement < 300) { // e.g., Annual Leave
            const balance = await prisma.leaveBalance.findUnique({
                where: {
                    employeeId_leaveTypeId_year: {
                        employeeId: payload.employeeId,
                        leaveTypeId: leaveType.id,
                        year: currentYear
                    }
                }
            });

            // If no balance record, we assume they have the default entitlement
            const available = balance ? Number(balance.entitlement) + Number(balance.carryOver) - Number(balance.used) : leaveType.annualEntitlement;

            if (payload.totalDays > available) {
                throw new Error(`Insufficient leave balance. You requested ${payload.totalDays} days, but only have ${available} available.`);
            }
        }

        return prisma.leaveRequest.create({
            data: {
                ...payload,
                status: RequestStatus.PENDING
            }
        });
    }

    static async processLeaveRequest(id: string, status: "APPROVED" | "REJECTED", approvedById: string) {
        return prisma.$transaction(async (tx) => {
            const request = await tx.leaveRequest.findUnique({
                where: { id },
                include: { leaveType: true }
            });

            if (!request) throw new Error("Leave request not found");
            if (request.status !== "PENDING") throw new Error("Leave request is already processed");

            // Update status
            const updated = await tx.leaveRequest.update({
                where: { id },
                data: {
                    status,
                    approvedById
                }
            });

            // If approved, deduct balance
            if (status === "APPROVED" && request.leaveType.annualEntitlement > 0 && request.leaveType.annualEntitlement < 300) {
                const year = request.startDate.getFullYear();

                const balance = await tx.leaveBalance.findUnique({
                    where: {
                        employeeId_leaveTypeId_year: {
                            employeeId: request.employeeId,
                            leaveTypeId: request.leaveTypeId,
                            year
                        }
                    }
                });

                if (balance) {
                    await tx.leaveBalance.update({
                        where: { id: balance.id },
                        data: { used: Number(balance.used) + Number(request.totalDays) }
                    });
                } else {
                    // Create balance record if it didn't exist
                    await tx.leaveBalance.create({
                        data: {
                            employeeId: request.employeeId,
                            leaveTypeId: request.leaveTypeId,
                            year,
                            entitlement: request.leaveType.annualEntitlement,
                            used: request.totalDays,
                            carryOver: 0,
                        }
                    });
                }
            }

            return updated;
        });
    }
}
