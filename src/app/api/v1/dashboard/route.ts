import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { DashboardService } from "@/lib/services/dashboard.service";

export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const data = await DashboardService.getDashboardStats();
        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error("GET /api/v1/dashboard error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
