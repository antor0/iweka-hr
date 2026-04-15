import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import { BpjsConfigSchema } from "@/lib/validators/bpjs-config.schema";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const id = (await params).id;
        const body = await req.json();
        
        const validated = BpjsConfigSchema.parse(body);

        const updatedConfig = await prisma.bpjsConfig.update({
            where: { id },
            data: validated
        });

        if (validated.isActive) {
           // Deactivate other active configs
            await prisma.bpjsConfig.updateMany({
                where: { 
                    isActive: true,
                    id: { not: id }
               },
                data: { isActive: false, endDate: new Date() }
            });
        }

        return NextResponse.json({ data: updatedConfig });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const id = (await params).id;

        const deletedConfig = await prisma.bpjsConfig.delete({
            where: { id }
        });

        return NextResponse.json({ data: deletedConfig });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
