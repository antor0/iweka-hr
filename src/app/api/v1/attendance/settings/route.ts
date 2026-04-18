import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";

export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Anyone with attendance.read or setup.read could logically read this. 
        // We'll just allow logged-in internal users for now.
        const config = await prisma.companyConfig.findUnique({
            where: { id: "default" },
            select: { requireLocation: true }
        });

        return NextResponse.json({ requireLocation: config?.requireLocation ?? false });
    } catch (error: any) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        
        // Ensure user has admin rights to change settings
        // Ideally checking full setup.write, but attendance.write is also acceptable for attendance settings.
        if (!hasPermission(session.role, "attendance.write")) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        if (typeof body.requireLocation !== "boolean") {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
        }

        const updated = await prisma.companyConfig.upsert({
            where: { id: "default" },
            update: { requireLocation: body.requireLocation },
            create: { 
                id: "default", 
                companyName: "Default Company", 
                requireLocation: body.requireLocation 
            }
        });

        return NextResponse.json({ success: true, requireLocation: updated.requireLocation });
    } catch (error: any) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
