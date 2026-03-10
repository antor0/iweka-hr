import { NextRequest, NextResponse } from "next/server";
import { LeaveService } from "@/lib/services/leave.service";
import { CreateLeaveRequestSchema } from "@/lib/validators/leave.schema";
import { getSession } from "@/lib/auth/session";
import { RequestStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "10", 10);

        let employeeId = searchParams.get("employeeId") || undefined;
        // Non-admins can only see their own
        if (session.role !== "SYSTEM_ADMIN" && session.role !== "HR_ADMIN" && session.role !== "HR_MANAGER") {
            employeeId = session.employeeId || undefined;
        }

        const statusStr = searchParams.get("status");
        let status: RequestStatus | undefined = undefined;
        if (statusStr && Object.values(RequestStatus).includes(statusStr as RequestStatus)) {
            status = statusStr as RequestStatus;
        }

        const data = await LeaveService.getLeaveRequests(page, limit, employeeId, status);
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session || !session.employeeId) {
            return NextResponse.json({ error: "Unauthorized or no employee linked" }, { status: 401 });
        }

        const body = await request.json();

        // Force the employeeId to be the logged-in user unless it's an admin creating on behalf
        if (session.role !== "SYSTEM_ADMIN" && session.role !== "HR_ADMIN") {
            body.employeeId = session.employeeId;
        } else if (!body.employeeId) {
            body.employeeId = session.employeeId;
        }

        const parsed = CreateLeaveRequestSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 });
        }

        const record = await LeaveService.createLeaveRequest(parsed.data);
        return NextResponse.json({ success: true, data: record }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
