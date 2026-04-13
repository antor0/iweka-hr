import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getEssSession } from "@/lib/auth/ess-session";
import { NotificationService } from "@/lib/services/notification.service";
import { prisma } from "@/lib/db/prisma";

export async function POST(req: NextRequest) {
    try {
        let userId: string | undefined;

        const session = await getSession();
        if (session?.userId) {
            userId = session.userId;
        } else {
            const essSession = await getEssSession();
            if (essSession?.employeeId) {
                const user = await prisma.user.findUnique({ where: { employeeId: essSession.employeeId } });
                if (user) userId = user.id;
            }
        }

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        await NotificationService.markAllRead(userId);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}