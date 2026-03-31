import { NextResponse } from "next/server";
import { deleteEssSession } from "@/lib/auth/ess-session";

export async function POST() {
    await deleteEssSession();
    return NextResponse.json({ success: true });
}
