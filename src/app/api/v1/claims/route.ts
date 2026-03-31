import { NextRequest, NextResponse } from "next/server";
import { ClaimsService } from "@/lib/services/claims.service";
import { CreateClaimSchema } from "@/lib/validators/claims.schema";
import { getSession } from "@/lib/auth/session";
import { ClaimStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

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

        // Determine which employeeId to use
        let targetEmployeeId: string;
        if (session.role !== "SYSTEM_ADMIN" && session.role !== "HR_ADMIN") {
            targetEmployeeId = session.employeeId;
        } else {
            targetEmployeeId = body.employeeId || session.employeeId;
        }

        // Verify the target employee actually exists (guards against stale sessions after DB resets)
        const employee = await prisma.employee.findUnique({
            where: { id: targetEmployeeId },
            select: { id: true },
        });

        if (!employee) {
            return NextResponse.json(
                { error: "Employee not found. Your session may be outdated — please log out and log back in." },
                { status: 400 }
            );
        }

        body.employeeId = employee.id;

        const parsed = CreateClaimSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 });
        }

        const claim = await ClaimsService.createClaim(parsed.data);
        return NextResponse.json({ success: true, data: claim }, { status: 201 });
    } catch (error: any) {
        console.error("Admin claims POST error:", error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
