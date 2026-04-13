import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
    try {
        const session = await getSession();

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.userId },
            include: {
                employee: {
                    select: {
                        fullName: true,
                        photoUrl: true,
                        department: { select: { name: true } },
                        position: { select: { title: true } },
                    }
                }
            }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: {
                id: user.id,
                email: user.email,
                role: user.role,
                fullName: user.fullName || user.employee?.fullName || user.email.split("@")[0],
                photoUrl: user.photoUrl || user.employee?.photoUrl || null,
                employeeId: user.employeeId,
                department: user.employee?.department?.name || null,
                position: user.employee?.position?.title || null,
                isPlatformOnly: !user.employeeId,
            }
        });
    } catch (error: any) {
        console.error("GET /api/v1/auth/me error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
