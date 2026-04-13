import { NextResponse } from "next/server";
import { HolidayService } from "@/lib/services/holiday.service";
import { CreateHolidaySchema } from "@/lib/validators/holiday.schema";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const yearParam = searchParams.get("year");
        const year = yearParam ? parseInt(yearParam) : new Date().getFullYear();

        const data = await HolidayService.getHolidays(year);
        return NextResponse.json({ data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const payload = CreateHolidaySchema.parse(body);
        const data = await HolidayService.createHoliday(payload);
        return NextResponse.json({ data }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
