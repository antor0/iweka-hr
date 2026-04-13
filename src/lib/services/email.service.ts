import nodemailer from "nodemailer";
import { prisma } from "@/lib/db/prisma";

export interface EmailPayload {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
}

export class EmailService {
    private static async getTransporter() {
        const config = await prisma.emailConfig.findFirst({
            where: { isActive: true },
            orderBy: { id: "desc" },
        });

        if (!config) {
            throw new Error("No active email configuration found. Please configure SMTP in Settings.");
        }

        return {
            transporter: nodemailer.createTransport({
                host: config.smtpHost,
                port: config.smtpPort,
                secure: config.smtpPort === 465,
                auth: {
                    user: config.smtpUser,
                    pass: config.smtpPass,
                },
            }),
            from: `"${config.fromName}" <${config.fromEmail}>`,
        };
    }

    static async send(payload: EmailPayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
        try {
            const { transporter, from } = await EmailService.getTransporter();

            const info = await transporter.sendMail({
                from,
                to: Array.isArray(payload.to) ? payload.to.join(", ") : payload.to,
                subject: payload.subject,
                html: payload.html,
                text: payload.text ?? payload.html.replace(/<[^>]+>/g, ""),
            });

            return { success: true, messageId: info.messageId };
        } catch (error: any) {
            console.error("[EmailService] Failed to send email:", error.message);
            return { success: false, error: error.message };
        }
    }

    // ---------------------------------------------------------------------------
    // Convenience Templates
    // ---------------------------------------------------------------------------
    static buildApprovalRequestEmail(opts: {
        approverName: string;
        requesterName: string;
        requestType: string;
        requestDetail: string;
        approvalLink: string;
    }): EmailPayload {
        return {
            to: "", // filled by caller
            subject: `[Action Required] ${opts.requestType} Approval Request from ${opts.requesterName}`,
            html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9;">
  <div style="background: #1a1a2e; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h2 style="color: #fff; margin: 0;">HRIS Approval Request</h2>
    <p style="color: #8888aa; margin: 8px 0 0;">Action required from you</p>
  </div>
  <div style="background: #fff; padding: 30px; border-radius: 0 0 12px 12px;">
    <p>Hi <strong>${opts.approverName}</strong>,</p>
    <p><strong>${opts.requesterName}</strong> has submitted a <strong>${opts.requestType}</strong> request that requires your approval.</p>
    <table style="width:100%; border-collapse: collapse; margin: 20px 0; background: #f9f9f9; border-radius: 8px; padding: 16px;">
      <tr><td style="padding: 8px 0; color: #666;">Request Type</td><td style="padding: 8px 0; font-weight: bold;">${opts.requestType}</td></tr>
      <tr><td style="padding: 8px 0; color: #666;">Details</td><td style="padding: 8px 0;">${opts.requestDetail}</td></tr>
    </table>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${opts.approvalLink}" style="background: #6366f1; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">Review Request →</a>
    </div>
    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
    <p style="color: #888; font-size: 12px;">This email was sent by the HRIS system. Do not reply to this email.</p>
  </div>
</div>`,
        };
    }

    static buildApprovalStatusEmail(opts: {
        requesterName: string;
        requestType: string;
        status: "APPROVED" | "REJECTED";
        notes?: string;
    }): EmailPayload {
        const isApproved = opts.status === "APPROVED";
        const statusColor = isApproved ? "#10b981" : "#ef4444";
        const statusText = isApproved ? "Approved ✓" : "Rejected ✗";

        return {
            to: "",
            subject: `Your ${opts.requestType} request has been ${opts.status.toLowerCase()}`,
            html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9;">
  <div style="background: #1a1a2e; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h2 style="color: #fff; margin: 0;">Request Status Update</h2>
  </div>
  <div style="background: #fff; padding: 30px; border-radius: 0 0 12px 12px;">
    <p>Hi <strong>${opts.requesterName}</strong>,</p>
    <p>Your <strong>${opts.requestType}</strong> request has been reviewed.</p>
    <div style="text-align: center; padding: 20px; margin: 20px 0; border-radius: 8px; background: ${statusColor}15; border: 1px solid ${statusColor}40;">
      <span style="font-size: 24px; font-weight: bold; color: ${statusColor}">${statusText}</span>
    </div>
    ${opts.notes ? `<p><strong>Notes from approver:</strong> ${opts.notes}</p>` : ""}
    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
    <p style="color: #888; font-size: 12px;">This email was sent by the HRIS system. Do not reply to this email.</p>
  </div>
</div>`,
        };
    }

    static buildSystemNotificationEmail(opts: {
        recipientName: string;
        title: string;
        message: string;
        link?: string;
    }): EmailPayload {
        return {
            to: "",
            subject: `[HRIS] ${opts.title}`,
            html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9;">
  <div style="background: #1a1a2e; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h2 style="color: #fff; margin: 0;">HRIS Notification</h2>
  </div>
  <div style="background: #fff; padding: 30px; border-radius: 0 0 12px 12px;">
    <p>Hi <strong>${opts.recipientName}</strong>,</p>
    <p style="font-size: 18px; font-weight: bold;">${opts.title}</p>
    <p>${opts.message}</p>
    ${opts.link ? `<div style="text-align: center; margin: 20px 0;"><a href="${opts.link}" style="background: #6366f1; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">View Details →</a></div>` : ""}
    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
    <p style="color: #888; font-size: 12px;">This email was sent by the HRIS system. Do not reply to this email.</p>
  </div>
</div>`,
        };
    }
}
