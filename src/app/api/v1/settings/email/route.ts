import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const EmailConfigSchema = z.object({
    smtpHost: z.string().min(2),
    smtpPort: z.number().int().min(1).max(65535),
    smtpUser: z.string().email(),
    smtpPass: z.string().min(1),
    fromName: z.string().min(1),
    fromEmail: z.string().email(),
    isActive: z.boolean().default(true),
});

export async function GET() {
    try {
        const config = await prisma.emailConfig.findFirst({
            where: { isActive: true },
            orderBy: { id: "desc" },
        });
        return NextResponse.json(config);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const validated = EmailConfigSchema.parse(body);

        // Deactivate all existing before creating new
        await prisma.emailConfig.updateMany({ data: { isActive: false } });
        const config = await prisma.emailConfig.create({ data: validated });
        return NextResponse.json(config, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const validated = EmailConfigSchema.parse(body);
        
        const existing = await prisma.emailConfig.findFirst({
            where: { isActive: true },
            orderBy: { id: "desc" }
        });

        if (existing) {
            const config = await prisma.emailConfig.update({
                where: { id: existing.id },
                data: validated
            });
            return NextResponse.json(config);
        }

        const config = await prisma.emailConfig.create({ data: validated });
        return NextResponse.json(config, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}