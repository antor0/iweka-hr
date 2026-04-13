import { NextRequest, NextResponse } from "next/server";
import { SalaryService } from "@/lib/services/salary.service";
import { EmployeeAllowanceSchema } from "@/lib/validators/salary.schema";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const allowances = await SalaryService.getEmployeeAllowances(id);
        return NextResponse.json(allowances);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const validated = EmployeeAllowanceSchema.parse(body);
        const allowance = await SalaryService.createEmployeeAllowance(id, validated);
        return NextResponse.json(allowance, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}