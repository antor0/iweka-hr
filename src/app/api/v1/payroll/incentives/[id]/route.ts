import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const incentive = await prisma.monthlyIncentive.findUnique({
            where: { id },
            include: {
                employee: {
                    select: {
                        id: true,
                        fullName: true,
                        employeeNumber: true,
                    }
                }
            }
        });
        if (!incentive) {
            return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: incentive });
    } catch (error: any) {
        console.error("GET incentive error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const data = await req.json();

        const updated = await prisma.monthlyIncentive.update({
            where: { id },
            data: {
                incentive: data.incentive,
                bonus: data.bonus,
                notes: data.notes,
            }
        });
        return NextResponse.json({ success: true, data: updated });
    } catch (error: any) {
        console.error("PUT incentive error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await prisma.monthlyIncentive.delete({ where: { id } });
        return NextResponse.json({ success: true, message: "Deleted successfully" });
    } catch (error: any) {
        console.error("DELETE incentive error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
