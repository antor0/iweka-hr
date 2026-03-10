import { NextResponse } from "next/server";
import { AuthService } from "@/lib/services/auth.service";
import { createSession } from "@/lib/auth/session";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
        }

        const user = await AuthService.login(email, password);

        if (!user) {
            return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
        }

        // Create JWT session
        await createSession(user.id, user.email, user.role, user.employeeId);

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                fullName: user.fullName,
            },
        });
    } catch (error: any) {
        console.error("Login error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
