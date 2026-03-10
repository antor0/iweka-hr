import { NextRequest, NextResponse } from "next/server";
import { PayrollService } from "@/lib/services/payroll.service";
import { UpdatePayrollStatusSchema } from "@/lib/validators/payroll.schema";
import { getSession } from "@/lib/auth/session";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session || !["HR_ADMIN", "SYSTEM_ADMIN", "HR_MANAGER"].includes(session.role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const resolvedParams = await params;
        const body = await request.json();
        const parsed = UpdatePayrollStatusSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 });
        }

        const record = await PayrollService.updateStatus(resolvedParams.id, parsed.data.status);

        return NextResponse.json({ success: true, data: record }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
