import { NextRequest, NextResponse } from "next/server";
import { getEssSession } from "@/lib/auth/ess-session";
import { OcrService } from "@/lib/services/ocr.service";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
    try {
        const session = await getEssSession();
        if (!session || !session.employeeId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get("receipt") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No receipt image uploaded" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // Save to public/uploads/claims/
        const uploadDir = path.join(process.cwd(), "public", "uploads", "claims");
        await mkdir(uploadDir, { recursive: true });

        const ext = path.extname(file.name) || ".jpg";
        const filename = `ess_${session.employeeId}_${Date.now()}${ext}`;
        const filepath = path.join(uploadDir, filename);
        await writeFile(filepath, buffer);

        const receiptUrl = `/uploads/claims/${filename}`;

        // Run OCR
        let ocrResult = null;
        try {
            ocrResult = await OcrService.extractFromImage(buffer);
        } catch (error) {
            console.error("ESS OCR extraction failed:", error);
            // Even if OCR fails, we still return the uploaded receipt URL
        }

        return NextResponse.json({
            success: true,
            data: {
                receiptUrl,
                rawText: ocrResult?.rawText || null,
                extractedAmount: ocrResult?.extractedAmount || null,
                merchant: ocrResult?.merchant || null,
            },
        });
    } catch (error: any) {
        console.error("ESS claims OCR POST error:", error);
        return NextResponse.json({ error: error.message || "Upload and OCR processing failed" }, { status: 500 });
    }
}
