import { NextRequest, NextResponse } from "next/server";
import { LeaveService } from "@/lib/services/leave.service";
import { ApproveRejectLeaveSchema } from "@/lib/validators/leave.schema";
import { getSession } from "@/lib/auth/session";
import { requirePermission } from "@/lib/auth/permissions";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const forbidden = requirePermission(session, "leave.approve");
        if (forbidden) return forbidden;
        if (!session.employeeId && session.role !== "SYSTEM_ADMIN") {
            return NextResponse.json({ error: "No employee profile linked to approver" }, { status: 403 });
        }

        const resolvedParams = await params;
        const body = await request.json();
        const parsed = ApproveRejectLeaveSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 });
        }

        const record = await LeaveService.processLeaveRequest(
            resolvedParams.id,
            parsed.data.status,
            session.employeeId || "SYSTEM"
        );

        return NextResponse.json({ success: true, data: record }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
