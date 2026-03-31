import { NextResponse } from "next/server";
import { getEssSession } from "@/lib/auth/ess-session";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
    try {
        const session = await getEssSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const employee = await prisma.employee.findUnique({
            where: { id: session.employeeId },
            select: {
                id: true,
                employeeNumber: true,
                fullName: true,
                email: true,
                phone: true,
                photoUrl: true,
                gender: true,
                hireDate: true,
                employmentStatus: true,
                employmentType: true,
                pinMustChange: true,
                department: { select: { name: true } },
                position: { select: { title: true } },
                grade: { select: { name: true, level: true } },
                manager: { select: { fullName: true } },
            },
        });

        if (!employee) {
            return NextResponse.json({ error: "Employee not found" }, { status: 404 });
        }

        return NextResponse.json({ data: employee });
    } catch (error) {
        console.error("ESS profile error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
