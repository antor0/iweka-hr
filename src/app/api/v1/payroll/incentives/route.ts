import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const month = url.searchParams.get("month");
        const year = url.searchParams.get("year");
        const employeeId = url.searchParams.get("employeeId");

        const where: any = {};
        if (month) where.month = parseInt(month, 10);
        if (year) where.year = parseInt(year, 10);
        if (employeeId) where.employeeId = employeeId;

        const incentives = await prisma.monthlyIncentive.findMany({
            where,
            include: {
                employee: {
                    select: {
                        id: true,
                        fullName: true,
                        employeeNumber: true,
                        department: { select: { name: true } },
                        position: { select: { title: true } }
                    }
                }
            },
            orderBy: [{ year: 'desc' }, { month: 'desc' }, { employee: { fullName: 'asc' } }]
        });

        return NextResponse.json({ success: true, data: incentives });
    } catch (error: any) {
        console.error("GET incentives error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        
        // Handle array of incentives for batch creation/update, or single
        const isBatch = Array.isArray(body);
        const dataArray = isBatch ? body : [body];
        
        const results = [];
        for (const data of dataArray) {
            const { employeeId, month, year, incentive = 0, bonus = 0, notes } = data;

            if (!employeeId || !month || !year) {
                return NextResponse.json({ success: false, error: "employeeId, month, and year are required" }, { status: 400 });
            }

            // Upsert incentive based on employeeId, month, year unique constraint
            const record = await prisma.monthlyIncentive.upsert({
                where: {
                    employeeId_month_year: {
                        employeeId,
                        month: parseInt(month, 10),
                        year: parseInt(year, 10),
                    }
                },
                update: {
                    incentive,
                    bonus,
                    notes,
                },
                create: {
                    employeeId,
                    month: parseInt(month, 10),
                    year: parseInt(year, 10),
                    incentive,
                    bonus,
                    notes,
                }
            });
            results.push(record);
        }

        return NextResponse.json({ success: true, data: isBatch ? results : results[0] });
    } catch (error: any) {
        console.error("POST incentives error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
