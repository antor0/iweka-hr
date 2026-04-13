import { NextRequest, NextResponse } from "next/server";
import { SuratService } from "@/lib/services/surat.service";

export async function GET() {
    try {
        const templates = await SuratService.getTemplates();
        return NextResponse.json(templates);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}