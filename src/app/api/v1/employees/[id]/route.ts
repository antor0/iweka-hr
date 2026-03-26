import { NextRequest, NextResponse } from "next/server";
import { EmployeeService } from "@/lib/services/employee.service";
import { UpdateEmployeeSchema } from "@/lib/validators/employee.schema";
import { getSession } from "@/lib/auth/session";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> } // In Next.js 15, route params can be a Promise
) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const resolvedParams = await params;
        const employee = await EmployeeService.getEmployeeById(resolvedParams.id);

        if (!employee) {
            return NextResponse.json({ error: "Employee not found" }, { status: 404 });
        }

        return NextResponse.json({ data: employee });
    } catch (error: any) {
        console.error("GET /api/v1/employees/[id] error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (session.role !== "SYSTEM_ADMIN" && session.role !== "HR_ADMIN") {
            return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
        }

        const resolvedParams = await params;
        const body = await request.json();
        const parsed = UpdateEmployeeSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({
                error: "Validation failed",
                details: parsed.error.format()
            }, { status: 400 });
        }

        const employee = await EmployeeService.updateEmployee(resolvedParams.id, parsed.data, session.userId);
        return NextResponse.json({ success: true, data: employee });
    } catch (error: any) {
        console.error("PUT /api/v1/employees/[id] error:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 400 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (session.role !== "SYSTEM_ADMIN" && session.role !== "HR_ADMIN") {
            return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
        }

        const resolvedParams = await params;
        await EmployeeService.deleteEmployee(resolvedParams.id);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("DELETE /api/v1/employees/[id] error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
