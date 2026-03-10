import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const departmentId = searchParams.get("departmentId");

        const where: any = {
            isActive: true
        };

        if (departmentId) {
            where.departmentId = departmentId;
        }

        const positions = await prisma.position.findMany({
            where,
            include: {
                department: {
                    select: { name: true }
                }
            },
            orderBy: { title: "asc" }
        });

        return NextResponse.json({ data: positions });
    } catch (error) {
        console.error("Error fetching positions:", error);
        return NextResponse.json({ error: "Failed to fetch positions" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { title, code, departmentId } = body;

        if (!title || !code || !departmentId) {
            return NextResponse.json(
                { error: "Title, code, and departmentId are required" },
                { status: 400 }
            );
        }

        const position = await prisma.position.create({
            data: {
                title,
                code,
                departmentId,
                isActive: true
            }
        });

        return NextResponse.json({ data: position }, { status: 201 });
    } catch (error: any) {
        console.error("Error creating position:", error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: "Position code must be unique" }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to create position" }, { status: 500 });
    }
}
