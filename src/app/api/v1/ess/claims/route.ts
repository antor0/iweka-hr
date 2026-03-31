import { NextRequest, NextResponse } from "next/server";
import { getEssSession } from "@/lib/auth/ess-session";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
    try {
        const session = await getEssSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const claims = await prisma.claim.findMany({
            where: { employeeId: session.employeeId },
            include: { items: true },
            orderBy: { createdAt: "desc" },
            take: 20,
        });

        return NextResponse.json({ data: claims });
    } catch (error) {
        console.error("ESS claims GET error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getEssSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { title, description, items } = body;

        if (!title || !items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                { error: "Title and at least one item are required" },
                { status: 400 }
            );
        }

        // Validate items
        for (const item of items) {
            if (!item.category || !item.description || !item.amount || !item.receiptDate) {
                return NextResponse.json(
                    { error: "Each item requires category, description, amount, and receipt date" },
                    { status: 400 }
                );
            }
        }

        // Verify the employee still exists (guards against stale sessions after DB resets)
        const employee = await prisma.employee.findUnique({
            where: { id: session.employeeId },
            select: { id: true, employeeNumber: true },
        });

        if (!employee) {
            return NextResponse.json(
                { error: "Session expired or employee not found. Please log in again." },
                { status: 401 }
            );
        }

        const totalAmount = items.reduce((sum: number, item: any) => sum + Number(item.amount), 0);

        // Generate claim number using verified employee number
        const count = await prisma.claim.count({ where: { employeeId: employee.id } });
        const empNum = employee.employeeNumber.replace("EMP-", "");
        const claimNumber = `CLM-${empNum}-${String(count + 1).padStart(4, "0")}`;

        const claim = await prisma.claim.create({
            data: {
                employeeId: employee.id,
                claimNumber,
                title: title.trim(),
                description: description?.trim() || null,
                status: "SUBMITTED",
                totalAmount,
                submittedAt: new Date(),
                items: {
                    create: items.map((item: any) => ({
                        category: item.category,
                        description: item.description.trim(),
                        amount: Number(item.amount),
                        receiptDate: new Date(item.receiptDate),
                        merchant: item.merchant?.trim() || null,
                        receiptUrl: item.receiptUrl || null,
                    })),
                },
            },
            include: { items: true },
        });

        return NextResponse.json({ success: true, data: claim }, { status: 201 });
    } catch (error) {
        console.error("ESS claims POST error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
