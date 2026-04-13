import { NextRequest, NextResponse } from "next/server";
import { LeaveService } from "@/lib/services/leave.service";
import { getSession } from "@/lib/auth/session";
import { hasPermission, requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const resolvedParams = await params;
        const record = await LeaveService.getLeaveRequestById(resolvedParams.id);

        if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });

        // Only creator or those with leave.read permission can view
        if (!hasPermission(session.role, "leave.read") && record.employeeId !== session.employeeId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        return NextResponse.json({ data: record });
    } catch (error: any) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session || !session.employeeId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const forbidden = requirePermission(session, "leave.approve");
        if (forbidden) return forbidden;

        const resolvedParams = await params;
        const { status } = await request.json();

        if (status !== "APPROVED" && status !== "REJECTED") {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        // Fetch fresh employee ID from DB to prevent FK violation if JWT has a stale DB UUID
        const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { employeeId: true } });
        const validApproverId = user?.employeeId;

        if (!validApproverId) {
            return NextResponse.json({ error: "Your user account is not linked to a valid employee profile" }, { status: 400 });
        }

        const result = await LeaveService.processLeaveRequest(resolvedParams.id, status, validApproverId);
        return NextResponse.json({ success: true, data: result });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 400 });
    }
}
