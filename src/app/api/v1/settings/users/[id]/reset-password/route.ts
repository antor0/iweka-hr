import { NextRequest, NextResponse } from "next/server";
import { UserService } from "@/lib/services/user.service";
import { ResetUserPasswordSchema } from "@/lib/validators/user.schema";
import { getSession } from "@/lib/auth/session";
import { requirePermission } from "@/lib/auth/permissions";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        const forbidden = requirePermission(session, "users.manage");
        if (forbidden) return forbidden;

        const resolvedParams = await params;
        const body = await request.json();
        const parsed = ResetUserPasswordSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 });
        }

        await UserService.resetPassword(resolvedParams.id, parsed.data.password);
        return NextResponse.json({ success: true, message: "Password reset successful" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
