import { NextRequest, NextResponse } from "next/server";
import { PayrollService } from "@/lib/services/payroll.service";
import { getSession } from "@/lib/auth/session";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        // Strict access check. Only HR_ADMIN, SYSTEM_ADMIN, and HR_MANAGER can see payroll run details.
        // Employees see their individual `PayrollItem` via their own ESS endpoint.
        if (!session || !["HR_ADMIN", "SYSTEM_ADMIN", "HR_MANAGER"].includes(session.role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const resolvedParams = await params;
        const record = await PayrollService.getPayrollRunById(resolvedParams.id);

        if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });

        return NextResponse.json({ data: record });
    } catch (error: any) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
