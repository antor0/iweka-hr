import { NextRequest, NextResponse } from "next/server";
import { SalaryService } from "@/lib/services/salary.service";
import { MonthlyVariableInputSchema } from "@/lib/validators/salary.schema";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const inputs = await SalaryService.getMonthlyVariableInputs(id);
        return NextResponse.json(inputs);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const validated = MonthlyVariableInputSchema.parse(body);
        const input = await SalaryService.upsertMonthlyVariableInput(id, validated);
        return NextResponse.json(input, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}