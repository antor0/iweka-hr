import { NextRequest, NextResponse } from "next/server";
import { AttendanceService } from "@/lib/services/attendance.service";
import { UpdateAttendanceSchema } from "@/lib/validators/attendance.schema";
import { getSession } from "@/lib/auth/session";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const resolvedParams = await params;
        const record = await AttendanceService.getAttendanceById(resolvedParams.id);

        if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });

        // Ensure user can only view their own record unless admin
        if (session.role !== "SYSTEM_ADMIN" && session.role !== "HR_ADMIN" && record.employeeId !== session.employeeId) {
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
        if (!session || (session.role !== "SYSTEM_ADMIN" && session.role !== "HR_ADMIN")) {
            return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
        }

        const resolvedParams = await params;
        const body = await request.json();
        const parsed = UpdateAttendanceSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 });
        }

        const record = await AttendanceService.updateAttendance(resolvedParams.id, parsed.data);
        return NextResponse.json({ success: true, data: record });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session || (session.role !== "SYSTEM_ADMIN" && session.role !== "HR_ADMIN")) {
            return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
        }

        const resolvedParams = await params;
        await AttendanceService.deleteAttendance(resolvedParams.id);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
