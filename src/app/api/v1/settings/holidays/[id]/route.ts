import { NextResponse } from "next/server";
import { HolidayService } from "@/lib/services/holiday.service";
import { UpdateHolidaySchema } from "@/lib/validators/holiday.schema";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const payload = UpdateHolidaySchema.parse(body);
        const data = await HolidayService.updateHoliday(id, payload);
        return NextResponse.json({ data });
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
        await HolidayService.deleteHoliday(id);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
