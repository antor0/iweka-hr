import { NextRequest, NextResponse } from "next/server";
import { LeaveService } from "@/lib/services/leave.service";
import { getSession } from "@/lib/auth/session";

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

        // Only creator or HR admins can view
        if (session.role !== "SYSTEM_ADMIN" && session.role !== "HR_ADMIN" && session.role !== "HR_MANAGER" && record.employeeId !== session.employeeId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        return NextResponse.json({ data: record });
    } catch (error: any) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
