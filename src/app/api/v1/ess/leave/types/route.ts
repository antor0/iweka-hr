import { NextResponse } from "next/server";
import { getEssSession } from "@/lib/auth/ess-session";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
    try {
        const session = await getEssSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const leaveTypes = await prisma.leaveType.findMany({
            where: { isActive: true },
            orderBy: { name: "asc" },
        });

        return NextResponse.json({ data: leaveTypes });
    } catch (error) {
        console.error("ESS leave types error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
