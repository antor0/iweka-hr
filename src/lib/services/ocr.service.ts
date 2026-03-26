import Tesseract from "tesseract.js";

export interface OcrResult {
    rawText: string;
    extractedAmount: number | null;
    merchant: string | null;
}

export class OcrService {
    /**
     * Run OCR on an image buffer and extract receipt info.
     */
    static async extractFromImage(imageBuffer: Buffer): Promise<OcrResult> {
        const { data } = await Tesseract.recognize(imageBuffer, "eng+ind", {
            logger: () => {}, // suppress logs
        });

        const rawText = data.text;
        const extractedAmount = this.parseAmount(rawText);
        const merchant = this.parseMerchant(rawText);

        return { rawText, extractedAmount, merchant };
    }

    /**
     * Parse monetary amount from OCR text.
     * Looks for patterns like:
     *   - Rp 150.000 / Rp. 150,000 / Rp150000
     *   - TOTAL: 150.000
     *   - Total xxx,xxx.xx
     *   - IDR 150,000
     */
    static parseAmount(text: string): number | null {
        const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

        // Try to find lines with "total", "amount", "grand total", "jumlah"
        const priorityKeywords = ["grand total", "total", "jumlah", "amount", "subtotal", "sub total"];

        for (const keyword of priorityKeywords) {
            for (const line of lines) {
                if (line.toLowerCase().includes(keyword)) {
                    const amount = this.extractNumberFromLine(line);
                    if (amount && amount > 0) return amount;
                }
            }
        }

        // Fallback: find largest Rp/IDR amount in full text
        const rpPattern = /(?:Rp\.?\s*|IDR\s*)([0-9][0-9.,]*)/gi;
        let match;
        let maxAmount = 0;

        while ((match = rpPattern.exec(text)) !== null) {
            const num = this.normalizeNumber(match[1]);
            if (num > maxAmount) maxAmount = num;
        }

        return maxAmount > 0 ? maxAmount : null;
    }

    /**
     * Extract a number from a line of text.
     */
    static extractNumberFromLine(line: string): number | null {
        // Remove currency prefixes
        const cleaned = line.replace(/(?:Rp\.?\s*|IDR\s*)/gi, "");
        // Find numbers with separators
        const numPattern = /([0-9][0-9.,]*[0-9])/g;
        const matches = cleaned.match(numPattern);

        if (!matches) return null;

        // Return the largest number found in the line
        let max = 0;
        for (const m of matches) {
            const num = this.normalizeNumber(m);
            if (num > max) max = num;
        }

        return max > 0 ? max : null;
    }

    /**
     * Normalize number string: handle Indonesian format (150.000 = 150000)
     * and international format (150,000.50 = 150000.50).
     */
    static normalizeNumber(str: string): number {
        const s = str.trim();

        // If has both . and ,
        if (s.includes(".") && s.includes(",")) {
            const lastDot = s.lastIndexOf(".");
            const lastComma = s.lastIndexOf(",");

            if (lastComma > lastDot) {
                // Format: 150.000,50 (European/Indonesian decimal comma)
                return parseFloat(s.replace(/\./g, "").replace(",", "."));
            } else {
                // Format: 150,000.50 (international)
                return parseFloat(s.replace(/,/g, ""));
            }
        }

        // Only dots: could be 150.000 (Indonesian thousands) or 15.50 (decimal)
        if (s.includes(".")) {
            const parts = s.split(".");
            const lastPart = parts[parts.length - 1];
            if (lastPart.length === 3 && parts.length > 1) {
                // Likely thousands separator: 150.000 => 150000
                return parseFloat(s.replace(/\./g, ""));
            }
            // Likely decimal: 15.50
            return parseFloat(s);
        }

        // Only commas: 150,000
        if (s.includes(",")) {
            const parts = s.split(",");
            const lastPart = parts[parts.length - 1];
            if (lastPart.length === 3 && parts.length > 1) {
                return parseFloat(s.replace(/,/g, ""));
            }
            // Likely decimal comma: 15,50
            return parseFloat(s.replace(",", "."));
        }

        return parseFloat(s) || 0;
    }

    /**
     * Try to extract merchant name — typically first line or near top.
     */
    static parseMerchant(text: string): string | null {
        const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 2);

        // Skip lines that are mostly numbers or dates
        for (const line of lines.slice(0, 5)) {
            if (/^\d+$/.test(line)) continue;
            if (/^\d{2}[\/-]\d{2}[\/-]\d{2,4}/.test(line)) continue;
            if (line.length < 3) continue;
            // Return first meaningful line as merchant
            return line.substring(0, 100);
        }

        return null;
    }
}
