import { NextRequest, NextResponse } from "next/server";
import { getEssSession } from "@/lib/auth/ess-session";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
    try {
        const session = await getEssSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const empId = session.employeeId;

        // Find all workflows where this employee is an approver
        const workflows = await prisma.approvalWorkflow.findMany({
            where: {
                OR: [
                    { level1ApproverId: empId },
                    { level2ApproverId: empId }
                ]
            }
        });

        const leaveDeptIds = workflows.filter(w => w.approvalType === "LEAVE").map(w => w.departmentId);
        const claimDeptIds = workflows.filter(w => w.approvalType === "CLAIM" || w.approvalType === "BUDGETING").map(w => w.departmentId);
        // Assuming budgeting falls under Claims or some other model, but we'll focus on Leave and Claim.

        const [leaveRequests, claims] = await Promise.all([
            leaveDeptIds.length > 0 ? prisma.leaveRequest.findMany({
                where: {
                    status: "PENDING",
                    employee: { departmentId: { in: leaveDeptIds } }
                },
                include: {
                    employee: { select: { fullName: true, employeeNumber: true } },
                    leaveType: { select: { name: true } }
                },
                orderBy: { startDate: "desc" }
            }) : Promise.resolve([]),

            claimDeptIds.length > 0 ? prisma.claim.findMany({
                where: {
                    status: "SUBMITTED",
                    employee: { departmentId: { in: claimDeptIds } }
                },
                include: {
                    employee: { select: { fullName: true, employeeNumber: true } },
                    _count: { select: { items: true } }
                },
                orderBy: { submittedAt: "desc" }
            }) : Promise.resolve([])
        ]);

        return NextResponse.json({
            data: {
                leaves: leaveRequests,
                claims: claims
            }
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
