import { NextRequest, NextResponse } from "next/server";
import { PayrollService } from "@/lib/services/payroll.service";
import { GeneratePayrollSchema } from "@/lib/validators/payroll.schema";
import { getSession } from "@/lib/auth/session";
import { requirePermission } from "@/lib/auth/permissions";

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const forbidden = requirePermission(session, "payroll.run");
        if (forbidden) return forbidden;

        const body = await request.json();
        const parsed = GeneratePayrollSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 });
        }

        const runById = session.userId || "SYSTEM"; // Using userId (or mapping it correctly if we store user UUID in session)
        // Wait, the session payload inside session.ts sets 'userId', 'email', 'role', 'employeeId'.

        const record = await PayrollService.generatePayroll(parsed.data, runById);
        return NextResponse.json({ success: true, data: record }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
