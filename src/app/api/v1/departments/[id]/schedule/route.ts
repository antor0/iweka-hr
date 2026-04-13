import { NextResponse } from "next/server";
import { ScheduleService } from "@/lib/services/schedule.service";
import { GenerateScheduleSchema } from "@/lib/validators/schedule.schema";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));
        const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));

        const data = await ScheduleService.getSchedule(id, month, year);
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
        const payload = GenerateScheduleSchema.parse(body);
        const count = await ScheduleService.generateSchedule(id, payload.month, payload.year);
        return NextResponse.json({ success: true, count });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const month = parseInt(searchParams.get("month") || "");
        const year = parseInt(searchParams.get("year") || "");

        if (!month || !year) throw new Error("Month and year are required to clear schedule");

        await ScheduleService.deleteSchedule(id, month, year);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
