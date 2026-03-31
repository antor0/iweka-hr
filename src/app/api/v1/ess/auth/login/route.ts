import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { createEssSession } from "@/lib/auth/ess-session";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { employeeNumber, pin } = body;

        if (!employeeNumber || !pin) {
            return NextResponse.json(
                { error: "Employee ID and PIN are required" },
                { status: 400 }
            );
        }

        const employee = await prisma.employee.findUnique({
            where: { employeeNumber },
            select: {
                id: true,
                employeeNumber: true,
                fullName: true,
                employmentStatus: true,
                pin: true,
                pinMustChange: true,
            },
        });

        if (!employee || employee.employmentStatus === "TERMINATED") {
            return NextResponse.json(
                { error: "Invalid Employee ID or PIN" },
                { status: 401 }
            );
        }

        // If no PIN set yet, compare with default
        if (!employee.pin) {
            return NextResponse.json(
                { error: "PIN not set. Please contact HR." },
                { status: 401 }
            );
        }

        const isPinValid = await bcrypt.compare(pin, employee.pin);
        if (!isPinValid) {
            return NextResponse.json(
                { error: "Invalid Employee ID or PIN" },
                { status: 401 }
            );
        }

        await createEssSession(employee.id, employee.employeeNumber, employee.fullName);

        return NextResponse.json({
            success: true,
            pinMustChange: employee.pinMustChange,
            employee: {
                id: employee.id,
                employeeNumber: employee.employeeNumber,
                fullName: employee.fullName,
            },
        });
    } catch (error) {
        console.error("ESS login error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
