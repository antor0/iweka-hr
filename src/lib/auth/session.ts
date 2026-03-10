import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const secretKey = process.env.SESSION_SECRET || "default_super_secret_key_change_in_production";
const encodedKey = new TextEncoder().encode(secretKey);

export type SessionPayload = {
    userId: string;
    email: string;
    role: string;
    employeeId?: string | null;
    expiresAt: Date;
};

export async function encrypt(payload: SessionPayload) {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(encodedKey);
}

export async function decrypt(session: string | undefined = "") {
    if (!session) return null;
    try {
        const { payload } = await jwtVerify(session, encodedKey, {
            algorithms: ["HS256"],
        });
        return payload as SessionPayload;
    } catch (error) {
        return null;
    }
}

export async function createSession(userId: string, email: string, role: string, employeeId?: string | null) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const session = await encrypt({ userId, email, role, employeeId, expiresAt });

    const cookieStore = await cookies();
    cookieStore.set("session", session, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        expires: expiresAt,
        sameSite: "lax",
        path: "/",
    });
}

export async function updateSession(request: NextRequest) {
    const session = request.cookies.get("session")?.value;
    const payload = await decrypt(session);

    if (!session || !payload) {
        return null;
    }

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    payload.expiresAt = expiresAt;

    const res = NextResponse.next();
    res.cookies.set({
        name: "session",
        value: await encrypt(payload),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        expires: expiresAt,
        sameSite: "lax",
        path: "/",
    });

    return res;
}

export async function deleteSession() {
    const cookieStore = await cookies();
    cookieStore.delete("session");
}

export async function getSession() {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    return await decrypt(session);
}
