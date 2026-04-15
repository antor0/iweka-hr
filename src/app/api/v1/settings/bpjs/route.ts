import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import { BpjsConfigSchema } from "@/lib/validators/bpjs-config.schema";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const history = searchParams.get("history") === "true";

        if (history) {
            const configs = await prisma.bpjsConfig.findMany({
                orderBy: { effectiveDate: "desc" }
            });
            return NextResponse.json({ data: configs });
        }

        let config = await prisma.bpjsConfig.findFirst({
            where: { isActive: true },
            orderBy: { effectiveDate: "desc" }
        });

        // Fallback to active false if no active config is found.
        if (!config) {
             config = await prisma.bpjsConfig.findFirst({
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
        const validated = BpjsConfigSchema.parse(body);

        // Deactivate current active configs
        await prisma.bpjsConfig.updateMany({
            where: { isActive: true },
            data: { 
                isActive: false,
                endDate: new Date() // Set end date close to current date
            }
        });

        const newConfig = await prisma.bpjsConfig.create({
            data: {
                ...validated,
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
