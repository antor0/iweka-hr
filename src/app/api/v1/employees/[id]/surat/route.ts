import { NextRequest, NextResponse } from "next/server";
import { SuratService } from "@/lib/services/surat.service";
import { GenerateSuratSchema } from "@/lib/validators/surat.schema";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const history = await SuratService.getEmployeeSuratHistory(id);
        return NextResponse.json(history);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const validated = GenerateSuratSchema.parse(body);
        const surat = await SuratService.generateSurat(id, validated);
        return NextResponse.json(surat, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}