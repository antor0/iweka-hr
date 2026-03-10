import { NextRequest, NextResponse } from "next/server";
import { PayrollService } from "@/lib/services/payroll.service";
import { getSession } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session || (session.role !== "SYSTEM_ADMIN" && session.role !== "HR_ADMIN" && session.role !== "HR_MANAGER")) {
            return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "10", 10);

        const data = await PayrollService.getPayrollRuns(page, limit);
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
