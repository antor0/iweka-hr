import { NextRequest, NextResponse } from "next/server";
import { AttendanceService } from "@/lib/services/attendance.service";
import { ClockInSchema } from "@/lib/validators/attendance.schema";
import { getSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session || !session.employeeId) {
            return NextResponse.json({ error: "Unauthorized or no employee profile linked" }, { status: 401 });
        }

        const body = await request.json();

        // Auto inject employeeId from session if not provided (or overwrite for non-admins)
        if (session.role !== "SYSTEM_ADMIN" && session.role !== "HR_ADMIN") {
            body.employeeId = session.employeeId;
        } else if (!body.employeeId) {
            body.employeeId = session.employeeId;
        }

        const parsed = ClockInSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 });
        }

        const record = await AttendanceService.clockIn(parsed.data);
        return NextResponse.json({ success: true, data: record }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
