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
        const period = (searchParams.get("period") || "today") as 'today' | '30d' | '365d';

        const result = await AttendanceService.getDashboard(period);
        return NextResponse.json(result);
    } catch (error: any) {
        console.error("GET /api/v1/attendance/dashboard error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
