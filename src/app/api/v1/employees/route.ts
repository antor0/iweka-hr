import { NextRequest, NextResponse } from "next/server";
import { EmployeeService } from "@/lib/services/employee.service";
import { CreateEmployeeSchema } from "@/lib/validators/employee.schema";
import { getSession } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "10", 10);
        const search = searchParams.get("search") || undefined;
        const status = searchParams.get("status") || undefined;

        const result = await EmployeeService.getEmployees(page, limit, search, status);
        return NextResponse.json(result);
    } catch (error: any) {
        console.error("GET /api/v1/employees error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Optional: Check if user has HR_ADMIN role
        if (session.role !== "SYSTEM_ADMIN" && session.role !== "HR_ADMIN") {
            return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
        }

        const body = await request.json();

        // Validate with Zod
        const parsed = CreateEmployeeSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({
                error: "Validation failed",
                details: parsed.error.format()
            }, { status: 400 });
        }

        const employee = await EmployeeService.createEmployee(parsed.data, session.employeeId || undefined);
        return NextResponse.json({ success: true, data: employee }, { status: 201 });
    } catch (error: any) {
        console.error("POST /api/v1/employees error:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 400 });
    }
}
