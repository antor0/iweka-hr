import { NextRequest, NextResponse } from "next/server";
import { AttendanceService } from "@/lib/services/attendance.service";
import { getSession } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        // By default use the exact seeder date for demonstration consistency if no date is passed
        const dateParam = searchParams.get("date") || "2026-02-25";

        const result = await AttendanceService.getDailyDashboard(dateParam);
        return NextResponse.json(result);
    } catch (error: any) {
        console.error("GET /api/v1/attendance/dashboard error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
