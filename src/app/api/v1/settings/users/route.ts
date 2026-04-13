import { NextRequest, NextResponse } from "next/server";
import { UserService } from "@/lib/services/user.service";
import { CreateUserSchema } from "@/lib/validators/user.schema";
import { getSession } from "@/lib/auth/session";
import { requirePermission } from "@/lib/auth/permissions";

export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        const forbidden = requirePermission(session, "users.manage");
        if (forbidden) return forbidden;

        const users = await UserService.getUsers();
        return NextResponse.json({ data: users });
    } catch (error: any) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        const forbidden = requirePermission(session, "users.manage");
        if (forbidden) return forbidden;

        const body = await request.json();
        const parsed = CreateUserSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 });
        }

        const user = await UserService.createUser(parsed.data);
        // Do not return password hash
        const { passwordHash, ...userData } = user;
        return NextResponse.json({ success: true, data: userData }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
