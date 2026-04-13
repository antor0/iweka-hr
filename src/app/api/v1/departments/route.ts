import { NextRequest, NextResponse } from "next/server";
import { DepartmentService } from "@/lib/services/department.service";
import { CreateDepartmentSchema } from "@/lib/validators/department.schema";
import { getSession } from "@/lib/auth/session";
import { requirePermission } from "@/lib/auth/permissions";

export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search") || undefined;

        const data = await DepartmentService.getDepartments(search);
        return NextResponse.json({ data });
    } catch (error: any) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const forbidden = requirePermission(session, "organization.write");
        if (forbidden) return forbidden;

        const body = await request.json();
        const parsed = CreateDepartmentSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 });
        }

        const department = await DepartmentService.createDepartment(parsed.data);
        return NextResponse.json({ success: true, data: department }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
