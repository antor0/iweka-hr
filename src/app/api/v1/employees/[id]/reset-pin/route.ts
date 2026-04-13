import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const forbidden = requirePermission(session, "employees.write");
        if (forbidden) return forbidden;

        const { id } = await params;

        const employee = await prisma.employee.findUnique({
            where: { id },
            select: { id: true, fullName: true, employeeNumber: true },
        });

        if (!employee) {
            return NextResponse.json({ error: "Employee not found" }, { status: 404 });
        }

        const defaultPinHash = await bcrypt.hash("123456", 10);

        await prisma.employee.update({
            where: { id },
            data: {
                pin: defaultPinHash,
                pinMustChange: true,
            },
        });

        return NextResponse.json({
            success: true,
            message: `PIN for ${employee.fullName} has been reset to 123456. They will be prompted to change on next ESS login.`,
        });
    } catch (error) {
        console.error("Admin reset PIN error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
