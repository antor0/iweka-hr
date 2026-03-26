import { prisma } from "@/lib/db/prisma";
import { CreateClaimSchema, AddClaimItemSchema } from "@/lib/validators/claims.schema";
import { z } from "zod";
import { ClaimStatus } from "@prisma/client";

export class ClaimsService {
    /**
     * Generate unique claim number: CLM-YYYY-NNNN
     */
    static async generateClaimNumber(): Promise<string> {
        const year = new Date().getFullYear();
        const prefix = `CLM-${year}-`;

        const lastClaim = await prisma.claim.findFirst({
            where: { claimNumber: { startsWith: prefix } },
            orderBy: { claimNumber: "desc" },
            select: { claimNumber: true },
        });

        let nextNum = 1;
        if (lastClaim) {
            const parts = lastClaim.claimNumber.split("-");
            nextNum = parseInt(parts[2], 10) + 1;
        }

        return `${prefix}${String(nextNum).padStart(4, "0")}`;
    }

    /**
     * List claims with pagination and filters
     */
    static async getClaims(page = 1, limit = 10, employeeId?: string, status?: ClaimStatus) {
        const skip = (page - 1) * limit;
        const where: any = {};
        if (employeeId) where.employeeId = employeeId;
        if (status) where.status = status;

        const [data, total] = await Promise.all([
            prisma.claim.findMany({
                where,
                skip,
                take: limit,
                include: {
                    employee: { select: { fullName: true, employeeNumber: true } },
                    _count: { select: { items: true } },
                },
                orderBy: { createdAt: "desc" },
            }),
            prisma.claim.count({ where }),
        ]);

        return {
            data,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }

    /**
     * Get a single claim with all items
     */
    static async getClaimById(id: string) {
        return prisma.claim.findUnique({
            where: { id },
            include: {
                employee: { select: { fullName: true, employeeNumber: true, managerId: true } },
                approvedBy: { select: { fullName: true } },
                items: { orderBy: { createdAt: "asc" } },
            },
        });
    }

    /**
     * Create a new claim (DRAFT status)
     */
    static async createClaim(payload: z.infer<typeof CreateClaimSchema>) {
        const claimNumber = await this.generateClaimNumber();

        return prisma.claim.create({
            data: {
                ...payload,
                claimNumber,
                status: ClaimStatus.DRAFT,
                totalAmount: 0,
            },
        });
    }

    /**
     * Add an item (receipt) to a claim
     */
    static async addClaimItem(claimId: string, payload: z.infer<typeof AddClaimItemSchema>) {
        return prisma.$transaction(async (tx) => {
            const claim = await tx.claim.findUnique({ where: { id: claimId } });
            if (!claim) throw new Error("Claim not found");
            if (claim.status !== "DRAFT") throw new Error("Can only add items to a DRAFT claim");

            const item = await tx.claimItem.create({
                data: {
                    claimId,
                    ...payload,
                },
            });

            // Recalculate total
            const total = await tx.claimItem.aggregate({
                where: { claimId },
                _sum: { amount: true },
            });

            await tx.claim.update({
                where: { id: claimId },
                data: { totalAmount: total._sum.amount || 0 },
            });

            return item;
        });
    }

    /**
     * Delete a claim item
     */
    static async deleteClaimItem(claimId: string, itemId: string) {
        return prisma.$transaction(async (tx) => {
            const claim = await tx.claim.findUnique({ where: { id: claimId } });
            if (!claim) throw new Error("Claim not found");
            if (claim.status !== "DRAFT") throw new Error("Can only modify a DRAFT claim");

            await tx.claimItem.delete({ where: { id: itemId } });

            // Recalculate total
            const total = await tx.claimItem.aggregate({
                where: { claimId },
                _sum: { amount: true },
            });

            await tx.claim.update({
                where: { id: claimId },
                data: { totalAmount: total._sum.amount || 0 },
            });
        });
    }

    /**
     * Submit a claim (DRAFT → SUBMITTED)
     */
    static async submitClaim(id: string) {
        const claim = await prisma.claim.findUnique({
            where: { id },
            include: { _count: { select: { items: true } } },
        });

        if (!claim) throw new Error("Claim not found");
        if (claim.status !== "DRAFT") throw new Error("Only DRAFT claims can be submitted");
        if (claim._count.items === 0) throw new Error("Cannot submit a claim with no items");

        return prisma.claim.update({
            where: { id },
            data: {
                status: ClaimStatus.SUBMITTED,
                submittedAt: new Date(),
            },
        });
    }

    /**
     * Process a claim (approve / reject)
     */
    static async processClaim(id: string, status: "APPROVED" | "REJECTED", approvedById: string, rejectReason?: string | null) {
        const claim = await prisma.claim.findUnique({ where: { id } });
        if (!claim) throw new Error("Claim not found");
        if (claim.status !== "SUBMITTED") throw new Error("Only SUBMITTED claims can be processed");

        return prisma.claim.update({
            where: { id },
            data: {
                status,
                approvedById,
                approvedAt: status === "APPROVED" ? new Date() : undefined,
                rejectReason: status === "REJECTED" ? rejectReason : undefined,
            },
        });
    }

    /**
     * Get claim statistics
     */
    static async getClaimStats(employeeId?: string) {
        const where: any = employeeId ? { employeeId } : {};

        const [totalClaims, pending, approved, totalAmount] = await Promise.all([
            prisma.claim.count({ where }),
            prisma.claim.count({ where: { ...where, status: "SUBMITTED" } }),
            prisma.claim.count({ where: { ...where, status: "APPROVED" } }),
            prisma.claim.aggregate({
                where: { ...where, status: { in: ["APPROVED", "PAID"] } },
                _sum: { totalAmount: true },
            }),
        ]);

        return {
            totalClaims,
            pending,
            approved,
            totalAmount: totalAmount._sum.totalAmount || 0,
        };
    }
}
