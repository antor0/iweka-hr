import { NextRequest, NextResponse } from "next/server";
import { SalaryService } from "@/lib/services/salary.service";
import { EmployeeAllowanceSchema } from "@/lib/validators/salary.schema";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string, allowanceId: string }> }) {
    try {
        const { allowanceId } = await params;
        const body = await req.json();
        const validated = EmployeeAllowanceSchema.parse(body);
        const allowance = await SalaryService.updateEmployeeAllowance(allowanceId, validated);
        return NextResponse.json(allowance);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string, allowanceId: string }> }) {
    try {
        const { allowanceId } = await params;
        await SalaryService.deleteEmployeeAllowance(allowanceId);
        return new NextResponse(null, { status: 204 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}