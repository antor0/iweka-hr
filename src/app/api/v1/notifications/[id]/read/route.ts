import { NextRequest, NextResponse } from "next/server";
import { NotificationService } from "@/lib/services/notification.service";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await NotificationService.markRead(id);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}