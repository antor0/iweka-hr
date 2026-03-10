import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/auth/session";
import { jwtVerify } from "jose";

const secretKey = process.env.SESSION_SECRET || "default_super_secret_key_change_in_production";
const encodedKey = new TextEncoder().encode(secretKey);

export async function proxy(request: NextRequest) {
    const session = request.cookies.get("session")?.value;
    const isLoginPage = request.nextUrl.pathname.startsWith("/login");
    const isProtectedRoute = request.nextUrl.pathname.startsWith("/dashboard") || request.nextUrl.pathname.startsWith("/my");

    let isAuthenticated = false;

    if (session) {
        try {
            await jwtVerify(session, encodedKey, {
                algorithms: ["HS256"],
            });
            isAuthenticated = true;
        } catch (error) {
            isAuthenticated = false;
        }
    }

    if (isProtectedRoute && !isAuthenticated) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    if (isLoginPage && isAuthenticated) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Refresh the session expiration
    if (isAuthenticated) {
        const res = await updateSession(request);
        if (res) return res;
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
