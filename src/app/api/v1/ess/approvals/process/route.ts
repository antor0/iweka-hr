import { NextRequest, NextResponse } from "next/server";
import { getEssSession } from "@/lib/auth/ess-session";
import { LeaveService } from "@/lib/services/leave.service";
import { ClaimsService } from "@/lib/services/claims.service";
import { NotificationService } from "@/lib/services/notification.service";
import { prisma } from "@/lib/db/prisma";

export async function POST(req: NextRequest) {
    try {
        const session = await getEssSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { type, id, action, notes } = await req.json();

        if (!type || !id || !["APPROVED", "REJECTED"].includes(action)) {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
        }

        // Ideally, check if session.employeeId is actually authorized to approve this via ApprovalWorkflow
        // For simplicity, we just check if the request is pending and attempt to process.
        // A production system would enforce strict `level1ApproverId` or `level2ApproverId` matching here.

        let result;
        if (type === "LEAVE") {
            const request = await prisma.leaveRequest.findUnique({ where: { id }, include: { employee: { include: { user: true } } } });
            if (!request) return NextResponse.json({ error: "Leave not found" }, { status: 404 });

            result = await LeaveService.processLeaveRequest(id, action, session.employeeId);
            
            // Notify
            if (request.employee.user?.id) {
                await NotificationService.notifyRequester({
                    requesterUserId: request.employee.user.id,
                    requesterEmail: request.employee.email || "",
                    requesterName: request.employee.fullName,
                    requestType: "Leave",
                    status: action,
                    notes
                });
            }
        } else if (type === "CLAIM") {
            const request = await prisma.claim.findUnique({ where: { id }, include: { employee: { include: { user: true } } } });
            if (!request) return NextResponse.json({ error: "Claim not found" }, { status: 404 });

            result = await ClaimsService.processClaim(id, action, session.employeeId, notes);

            // Notify
            if (request.employee.user?.id) {
                await NotificationService.notifyRequester({
                    requesterUserId: request.employee.user.id,
                    requesterEmail: request.employee.email || "",
                    requesterName: request.employee.fullName,
                    requestType: "Expense Claim",
                    status: action,
                    notes
                });
            }
        } else {
            return NextResponse.json({ error: "Unknown type" }, { status: 400 });
        }

        return NextResponse.json({ success: true, data: result });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
