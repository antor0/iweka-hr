import { NextRequest, NextResponse } from "next/server";
import { SuratService } from "@/lib/services/surat.service";
import { SuratTemplateSchema } from "@/lib/validators/surat.schema";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const template = await SuratService.getTemplateById(id);
        if (!template) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json(template);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const validated = SuratTemplateSchema.parse(body);
        const template = await SuratService.updateTemplate(id, validated);
        return NextResponse.json(template);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}