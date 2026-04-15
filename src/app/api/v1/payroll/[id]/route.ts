import { NextRequest, NextResponse } from "next/server";
import { PayrollService } from "@/lib/services/payroll.service";
import { getSession } from "@/lib/auth/session";
import { requirePermission } from "@/lib/auth/permissions";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const forbidden = requirePermission(session, "payroll.read");
        if (forbidden) return forbidden;

        const resolvedParams = await params;
        const record = await PayrollService.getPayrollRunById(resolvedParams.id);

        if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });

        return NextResponse.json({ data: record });
    } catch (error: any) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const forbidden = requirePermission(session, "payroll.run");
        if (forbidden) return forbidden;

        const resolvedParams = await params;
        const body = await request.json();
        const { status } = body;

        const validStatuses = ["DRAFT", "REVIEW", "APPROVED", "FINALIZED"];
        if (!status || !validStatuses.includes(status)) {
            return NextResponse.json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` }, { status: 400 });
        }

        const updated = await PayrollService.updateStatus(resolvedParams.id, status);
        return NextResponse.json({ data: updated });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
