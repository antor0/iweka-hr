import { prisma } from "@/lib/db/prisma";
import { NotificationType } from "@prisma/client";
import { EmailService } from "./email.service";

export interface CreateNotificationPayload {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
    sendEmail?: boolean;
    emailTo?: string;
}

export class NotificationService {
    // ---------------------------------------------------------------------------
    // CREATE
    // ---------------------------------------------------------------------------
    static async create(payload: CreateNotificationPayload) {
        const notification = await prisma.notification.create({
            data: {
                userId: payload.userId,
                type: payload.type,
                title: payload.title,
                message: payload.message,
                link: payload.link,
            },
        });

        // Optionally dispatch email alongside the in-app notification
        if (payload.sendEmail && payload.emailTo) {
            const user = await prisma.user.findUnique({
                where: { id: payload.userId },
                select: { employee: { select: { fullName: true } }, email: true },
            });

            const recipientName = user?.employee?.fullName || user?.email || "User";

            const emailPayload = EmailService.buildSystemNotificationEmail({
                recipientName,
                title: payload.title,
                message: payload.message,
                link: payload.link,
            });

            const result = await EmailService.send({
                ...emailPayload,
                to: payload.emailTo,
            });

            if (result.success) {
                await prisma.notification.update({
                    where: { id: notification.id },
                    data: { emailSent: true },
                });
            }
        }

        return notification;
    }

    // ---------------------------------------------------------------------------
    // READ
    // ---------------------------------------------------------------------------
    static async getForUser(userId: string, limit = 20) {
        return prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: limit,
        });
    }

    static async getUnreadCount(userId: string) {
        return prisma.notification.count({
            where: { userId, isRead: false },
        });
    }

    // ---------------------------------------------------------------------------
    // MARK READ
    // ---------------------------------------------------------------------------
    static async markRead(notificationId: string) {
        return prisma.notification.update({
            where: { id: notificationId },
            data: { isRead: true },
        });
    }

    static async markAllRead(userId: string) {
        return prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
    }

    // ---------------------------------------------------------------------------
    // SEND APPROVAL REQUEST NOTIFICATION (utility for other services to call)
    // ---------------------------------------------------------------------------
    static async notifyApprover(opts: {
        approverUserId: string;
        approverEmail: string;
        approverName: string;
        requesterName: string;
        requestType: string;
        requestDetail: string;
        approvalLink: string;
    }) {
        // In-app notification
        await NotificationService.create({
            userId: opts.approverUserId,
            type: NotificationType.APPROVAL_NEEDED,
            title: `New ${opts.requestType} Approval Request`,
            message: `${opts.requesterName} has submitted a ${opts.requestType} request that needs your approval.`,
            link: opts.approvalLink,
            sendEmail: true,
            emailTo: opts.approverEmail,
        });
    }

    static async notifyRequester(opts: {
        requesterUserId: string;
        requesterEmail: string;
        requesterName: string;
        requestType: string;
        status: "APPROVED" | "REJECTED";
        notes?: string;
        link?: string;
    }) {
        const isApproved = opts.status === "APPROVED";

        const inAppNotif = await NotificationService.create({
            userId: opts.requesterUserId,
            type: NotificationType.APPROVAL_RESULT,
            title: `Your ${opts.requestType} has been ${opts.status.toLowerCase()}`,
            message: isApproved
                ? `Great news! Your ${opts.requestType} request has been approved.`
                : `Your ${opts.requestType} request was rejected.${opts.notes ? ` Reason: ${opts.notes}` : ""}`,
            link: opts.link,
        });

        // Email
        const emailPayload = EmailService.buildApprovalStatusEmail({
            requesterName: opts.requesterName,
            requestType: opts.requestType,
            status: opts.status,
            notes: opts.notes,
        });

        await EmailService.send({
            ...emailPayload,
            to: opts.requesterEmail,
        });

        return inAppNotif;
    }
}
