import { NextResponse } from "next/server";
import { TimesheetService } from "@/lib/services/timesheet.service";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));
        const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));

        const data = await TimesheetService.getTimesheets(id, month, year);
        return NextResponse.json({ data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { month, year } = body;
        
        if (!month || !year) throw new Error("Month and year required");

        const count = await TimesheetService.generateTimesheets(id, month, year);
        return NextResponse.json({ success: true, count });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
