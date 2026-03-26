import { NextRequest, NextResponse } from "next/server";
import { ClaimsService } from "@/lib/services/claims.service";
import { CreateClaimSchema } from "@/lib/validators/claims.schema";
import { getSession } from "@/lib/auth/session";
import { ClaimStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "10", 10);

        let employeeId = searchParams.get("employeeId") || undefined;
        // Non-admin users can only see their own claims
        if (session.role !== "SYSTEM_ADMIN" && session.role !== "HR_ADMIN" && session.role !== "HR_MANAGER" && session.role !== "FINANCE") {
            employeeId = session.employeeId || undefined;
        }

        const statusStr = searchParams.get("status");
        let status: ClaimStatus | undefined = undefined;
        if (statusStr && Object.values(ClaimStatus).includes(statusStr as ClaimStatus)) {
            status = statusStr as ClaimStatus;
        }

        const data = await ClaimsService.getClaims(page, limit, employeeId, status);

        // Also fetch stats
        const stats = await ClaimsService.getClaimStats(employeeId);

        return NextResponse.json({ ...data, stats });
    } catch (error: any) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session || !session.employeeId) {
            return NextResponse.json({ error: "Unauthorized or no employee linked" }, { status: 401 });
        }

        const body = await request.json();

        // Force employeeId for non-admins
        if (session.role !== "SYSTEM_ADMIN" && session.role !== "HR_ADMIN") {
            body.employeeId = session.employeeId;
        } else if (!body.employeeId) {
            body.employeeId = session.employeeId;
        }

        const parsed = CreateClaimSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 });
        }

        const claim = await ClaimsService.createClaim(parsed.data);
        return NextResponse.json({ success: true, data: claim }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
