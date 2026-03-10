import { NextRequest, NextResponse } from "next/server";
import { DepartmentService } from "@/lib/services/department.service";
import { UpdateDepartmentSchema } from "@/lib/validators/department.schema";
import { getSession } from "@/lib/auth/session";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const resolvedParams = await params;
        const department = await DepartmentService.getDepartmentById(resolvedParams.id);
        if (!department) return NextResponse.json({ error: "Not found" }, { status: 404 });

        return NextResponse.json({ data: department });
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
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const resolvedParams = await params;
        const body = await request.json();
        const parsed = UpdateDepartmentSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 });
        }

        const department = await DepartmentService.updateDepartment(resolvedParams.id, parsed.data);
        return NextResponse.json({ success: true, data: department });
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
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const resolvedParams = await params;
        await DepartmentService.deleteDepartment(resolvedParams.id);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
