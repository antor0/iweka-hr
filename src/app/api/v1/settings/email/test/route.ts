import { NextRequest, NextResponse } from "next/server";
import { EmailService } from "@/lib/services/email.service";

export async function POST(req: NextRequest) {
    try {
        const { to } = await req.json();
        if (!to) return NextResponse.json({ error: "to is required" }, { status: 400 });

        const result = await EmailService.send({
            to,
            subject: "HRIS Email Test",
            html: `<div style="font-family:sans-serif;padding:20px"><h2>HRIS Email Test</h2><p>If you receive this email, your SMTP configuration is working correctly. ✓</p><p style="color:#888;font-size:12px">Sent from HRIS Settings at ${new Date().toLocaleString()}</p></div>`
        });

        if (result.success) {
            return NextResponse.json({ success: true, messageId: result.messageId });
        }
        return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}