import { NextResponse } from "next/server";
import { ScheduleService } from "@/lib/services/schedule.service";
import { OverrideScheduleSchema } from "@/lib/validators/schedule.schema";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string, scheduleId: string }> }
) {
    try {
        const { scheduleId } = await params;
        const body = await request.json();
        const payload = OverrideScheduleSchema.parse(body);
        const data = await ScheduleService.overrideSchedule(scheduleId, payload);
        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
