import { NextRequest, NextResponse } from "next/server";
import { AttendanceService } from "@/lib/services/attendance.service";
import { CreateAttendanceSchema } from "@/lib/validators/attendance.schema";
import { getSession } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "10", 10);

        // HR admins can view all, ordinary employees only themselves
        const employeeId = (session.role === "SYSTEM_ADMIN" || session.role === "HR_ADMIN")
            ? searchParams.get("employeeId") || undefined
            : session.employeeId || undefined;

        const startDate = searchParams.get("startDate") || undefined;
        const endDate = searchParams.get("endDate") || undefined;

        const data = await AttendanceService.getAttendances(page, limit, employeeId, startDate, endDate);
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session || (session.role !== "SYSTEM_ADMIN" && session.role !== "HR_ADMIN")) {
            return NextResponse.json({ error: "Forbidden: Admins only for manual literal record creation" }, { status: 403 });
        }

        const body = await request.json();
        const parsed = CreateAttendanceSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 });
        }

        const record = await AttendanceService.createAttendance(parsed.data);
        return NextResponse.json({ success: true, data: record }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
