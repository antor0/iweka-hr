import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { OcrService } from "@/lib/services/ocr.service";

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const formData = await request.formData();
        const file = formData.get("receipt") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No receipt image uploaded" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const result = await OcrService.extractFromImage(buffer);

        return NextResponse.json({
            success: true,
            data: {
                rawText: result.rawText,
                extractedAmount: result.extractedAmount,
                merchant: result.merchant,
            },
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "OCR processing failed" }, { status: 500 });
    }
}
