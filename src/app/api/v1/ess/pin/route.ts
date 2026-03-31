import { NextRequest, NextResponse } from "next/server";
import { getEssSession } from "@/lib/auth/ess-session";
import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";

export async function PUT(request: NextRequest) {
    try {
        const session = await getEssSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { currentPin, newPin, confirmPin } = body;

        if (!currentPin || !newPin || !confirmPin) {
            return NextResponse.json({ error: "All PIN fields are required" }, { status: 400 });
        }

        if (newPin !== confirmPin) {
            return NextResponse.json({ error: "New PIN and confirmation do not match" }, { status: 400 });
        }

        if (newPin.length < 6 || newPin.length > 6 || !/^\d{6}$/.test(newPin)) {
            return NextResponse.json({ error: "PIN must be exactly 6 digits" }, { status: 400 });
        }

        const employee = await prisma.employee.findUnique({
            where: { id: session.employeeId },
            select: { pin: true },
        });

        if (!employee || !employee.pin) {
            return NextResponse.json({ error: "Employee not found" }, { status: 404 });
        }

        const isCurrentPinValid = await bcrypt.compare(currentPin, employee.pin);
        if (!isCurrentPinValid) {
            return NextResponse.json({ error: "Current PIN is incorrect" }, { status: 400 });
        }

        const newPinHash = await bcrypt.hash(newPin, 10);

        await prisma.employee.update({
            where: { id: session.employeeId },
            data: {
                pin: newPinHash,
                pinMustChange: false,
            },
        });

        return NextResponse.json({ success: true, message: "PIN changed successfully" });
    } catch (error) {
        console.error("ESS change PIN error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
