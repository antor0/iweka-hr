import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import { TaxConfigSchema } from "@/lib/validators/tax-config.schema";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const id = (await params).id;
        const body = await req.json();
        
        const validated = TaxConfigSchema.parse(body);

        const updatedConfig = await prisma.taxConfig.update({
            where: { id },
            data: validated as any
        });

        if (validated.isActive) {
           // Deactivate other active configs
            await prisma.taxConfig.updateMany({
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

        const deletedConfig = await prisma.taxConfig.delete({
            where: { id }
        });

        return NextResponse.json({ data: deletedConfig });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
