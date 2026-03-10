import { prisma } from "@/lib/db/prisma";

export class AuditService {
    static async log(
        userId: string,
        action: string,
        entityType: string,
        entityId: string,
        oldValues?: any,
        newValues?: any,
        ipAddress?: string,
        userAgent?: string
    ) {
        try {
            await prisma.auditLog.create({
                data: {
                    userId,
                    action,
                    entityType,
                    entityId,
                    oldValues: oldValues || {},
                    newValues: newValues || {},
                    ipAddress: ipAddress || "unknown",
                    userAgent: userAgent || "unknown"
                }
            });
        } catch (error) {
            console.error("Failed to create audit log:", error);
            // We usually don't want to throw and break the main transaction just because audit logging failed,
            // but in highly compliant systems we might. For now, we catch and log.
        }
    }

    static async getLogs(page = 1, limit = 20, entityType?: string, action?: string) {
        const skip = (page - 1) * limit;
        const where: any = {};

        if (entityType) where.entityType = entityType;
        if (action) where.action = action;

        const [data, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: { user: { select: { email: true } } }
            }),
            prisma.auditLog.count({ where })
        ]);

        return {
            data,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
        };
    }
}
