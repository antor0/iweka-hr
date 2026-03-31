import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secretKey = process.env.ESS_SESSION_SECRET || process.env.SESSION_SECRET || "ess_default_secret_key_change_in_production";
const encodedKey = new TextEncoder().encode(secretKey);

export type EssSessionPayload = {
    employeeId: string;
    employeeNumber: string;
    fullName: string;
    expiresAt: Date;
};

export async function essEncrypt(payload: EssSessionPayload) {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("8h")
        .sign(encodedKey);
}

export async function essDecrypt(token: string | undefined = "") {
    if (!token) return null;
    try {
        const { payload } = await jwtVerify(token, encodedKey, {
            algorithms: ["HS256"],
        });
        return payload as unknown as EssSessionPayload;
    } catch {
        return null;
    }
}

export async function createEssSession(
    employeeId: string,
    employeeNumber: string,
    fullName: string
) {
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours
    const token = await essEncrypt({ employeeId, employeeNumber, fullName, expiresAt });

    const cookieStore = await cookies();
    cookieStore.set("ess_session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        expires: expiresAt,
        sameSite: "lax",
        path: "/",
    });
}

export async function getEssSession(): Promise<EssSessionPayload | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get("ess_session")?.value;
    return essDecrypt(token);
}

export async function deleteEssSession() {
    const cookieStore = await cookies();
    cookieStore.delete("ess_session");
}
