import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { ChangePasswordSchema } from "@/lib/validators/user.schema";
import bcrypt from "bcryptjs";

export async function PUT(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const parsed = ChangePasswordSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({
                error: "Validation failed",
                details: parsed.error.format()
            }, { status: 400 });
        }

        const { currentPassword, newPassword } = parsed.data;

        // Fetch user
        const user = await prisma.user.findUnique({
            where: { id: session.userId }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isPasswordValid) {
            return NextResponse.json({ error: "Invalid current password" }, { status: 400 });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash: hashedPassword }
        });

        return NextResponse.json({ success: true, message: "Password updated successfully" });
    } catch (error: any) {
        console.error("PUT /api/v1/user/password error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
