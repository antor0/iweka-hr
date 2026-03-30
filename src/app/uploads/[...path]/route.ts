import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { readFile } from "fs/promises";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        const resolvedParams = await params;
        const filePathArray = resolvedParams.path || [];
        
        // Construct the absolute path to the file inside public/uploads
        const absolutePath = path.join(process.cwd(), "public", "uploads", ...filePathArray);

        // Basic security check to prevent directory traversal
        if (!absolutePath.startsWith(path.join(process.cwd(), "public", "uploads"))) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const fileBuffer = await readFile(absolutePath);
        
        // Guess the mime type based on extension
        const ext = path.extname(absolutePath).toLowerCase();
        let mimeType = "application/octet-stream";
        if (ext === ".png") mimeType = "image/png";
        else if (ext === ".jpg" || ext === ".jpeg") mimeType = "image/jpeg";
        else if (ext === ".gif") mimeType = "image/gif";
        else if (ext === ".pdf") mimeType = "application/pdf";
        else if (ext === ".svg") mimeType = "image/svg+xml";

        return new NextResponse(fileBuffer, {
            headers: {
                "Content-Type": mimeType,
                "Cache-Control": "public, max-age=31536000, immutable",
            },
        });
    } catch (error) {
        return new NextResponse("File not found", { status: 404 });
    }
}
