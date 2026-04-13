import { NextRequest, NextResponse } from "next/server";
import { UserService } from "@/lib/services/user.service";
import { UpdateUserSchema } from "@/lib/validators/user.schema";
import { getSession } from "@/lib/auth/session";
import { requirePermission } from "@/lib/auth/permissions";

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        const forbidden = requirePermission(session, "users.manage");
        if (forbidden) return forbidden;

        const resolvedParams = await params;
        const body = await request.json();
        const parsed = UpdateUserSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 });
        }

        const user = await UserService.updateUser(resolvedParams.id, parsed.data);
        const { passwordHash, ...userData } = user;
        return NextResponse.json({ success: true, data: userData });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        const forbidden = requirePermission(session, "users.manage");
        if (forbidden) return forbidden;

        const resolvedParams = await params;
        await UserService.deleteUser(resolvedParams.id);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
