import { NextRequest, NextResponse } from "next/server";
import { AttendanceService } from "@/lib/services/attendance.service";
import { ClockOutSchema } from "@/lib/validators/attendance.schema";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session || !session.employeeId) {
            return NextResponse.json({ error: "Unauthorized or no employee profile linked" }, { status: 401 });
        }

        const body = await request.json();

        // Auto inject employeeId from session
        if (!hasPermission(session.role, "attendance.write")) {
            body.employeeId = session.employeeId;
        } else if (!body.employeeId) {
            body.employeeId = session.employeeId;
        }

        const parsed = ClockOutSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 });
        }

        const record = await AttendanceService.clockOut(parsed.data);
        return NextResponse.json({ success: true, data: record }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
