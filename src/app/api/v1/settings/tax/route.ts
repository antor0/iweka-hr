import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import { TaxConfigSchema } from "@/lib/validators/tax-config.schema";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const history = searchParams.get("history") === "true";

        if (history) {
            const configs = await prisma.taxConfig.findMany({
                orderBy: { effectiveDate: "desc" }
            });
            return NextResponse.json({ data: configs });
        }

        let config = await prisma.taxConfig.findFirst({
            where: { isActive: true },
            orderBy: { effectiveDate: "desc" }
        });

        // Fallback to active false if no active config is found.
        if (!config) {
             config = await prisma.taxConfig.findFirst({
                 orderBy: { effectiveDate: "desc" }
             });
        }

        return NextResponse.json({ data: config });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const validated = TaxConfigSchema.parse(body);

        // Deactivate current active configs
        await prisma.taxConfig.updateMany({
            where: { isActive: true },
            data: { 
                isActive: false,
                endDate: new Date()
            }
        });

        const newConfig = await prisma.taxConfig.create({
            data: {
                ...(validated as any),
                isActive: true,
            }
        });

        return NextResponse.json({ data: newConfig }, { status: 201 });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
