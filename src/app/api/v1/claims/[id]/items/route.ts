import { NextRequest, NextResponse } from "next/server";
import { ClaimsService } from "@/lib/services/claims.service";
import { AddClaimItemSchema } from "@/lib/validators/claims.schema";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { OcrService } from "@/lib/services/ocr.service";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session || !session.employeeId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: claimId } = await params;

        // Verify ownership
        const claim = await ClaimsService.getClaimById(claimId);
        if (!claim) return NextResponse.json({ error: "Claim not found" }, { status: 404 });
        if (claim.employeeId !== session.employeeId && !hasPermission(session.role, "claims.read")) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const formData = await request.formData();
        const file = formData.get("receipt") as File | null;
        const category = formData.get("category") as string;
        const description = formData.get("description") as string;
        const amountStr = formData.get("amount") as string;
        const receiptDate = formData.get("receiptDate") as string;
        const merchant = formData.get("merchant") as string | null;

        let receiptUrl: string | null = null;
        let ocrRawText: string | null = null;

        // Save the file if provided
        if (file) {
            const buffer = Buffer.from(await file.arrayBuffer());

            // Save to public/uploads/claims/
            const uploadDir = path.join(process.cwd(), "public", "uploads", "claims");
            await mkdir(uploadDir, { recursive: true });

            const ext = path.extname(file.name) || ".jpg";
            const filename = `${claimId}_${Date.now()}${ext}`;
            const filepath = path.join(uploadDir, filename);
            await writeFile(filepath, buffer);

            receiptUrl = `/uploads/claims/${filename}`;

            // Run OCR if no amount provided
            if (!amountStr || amountStr === "0") {
                try {
                    const ocrResult = await OcrService.extractFromImage(buffer);
                    ocrRawText = ocrResult.rawText;
                } catch {
                    // OCR failed — continue without it
                }
            }
        }

        const amount = parseFloat(amountStr || "0");

        const itemData = {
            category: category as any,
            description: description || "Receipt",
            amount,
            receiptDate: receiptDate || new Date().toISOString(),
            merchant: merchant || null,
            receiptUrl,
            ocrRawText,
        };

        const parsed = AddClaimItemSchema.safeParse(itemData);
        if (!parsed.success) {
            return NextResponse.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 });
        }

        const item = await ClaimsService.addClaimItem(claimId, parsed.data);
        return NextResponse.json({ success: true, data: item }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
