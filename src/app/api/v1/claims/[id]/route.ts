import { NextRequest, NextResponse } from "next/server";
import { ClaimsService } from "@/lib/services/claims.service";
import { ProcessClaimSchema } from "@/lib/validators/claims.schema";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const claim = await ClaimsService.getClaimById(id);

        if (!claim) {
            return NextResponse.json({ error: "Claim not found" }, { status: 404 });
        }

        // Non-admin can only view their own claims
        if (
            !hasPermission(session.role, "claims.read") &&
            claim.employeeId !== session.employeeId
        ) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        return NextResponse.json(claim);
    } catch (error: any) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session || !session.employeeId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();

        // Handle submit action
        if (body.action === "submit") {
            const claim = await ClaimsService.getClaimById(id);
            if (!claim) return NextResponse.json({ error: "Claim not found" }, { status: 404 });

            // Only the claim owner can submit
            if (claim.employeeId !== session.employeeId) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }

            const updated = await ClaimsService.submitClaim(id);
            return NextResponse.json({ success: true, data: updated });
        }

        // Handle approve/reject action
        if (body.action === "process") {
            // Only HR/Manager/Finance can approve/reject
            if (!hasPermission(session.role, "claims.approve")) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }

            const parsed = ProcessClaimSchema.safeParse(body);
            if (!parsed.success) {
                return NextResponse.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 });
            }

            const updated = await ClaimsService.processClaim(
                id,
                parsed.data.status,
                session.employeeId,
                parsed.data.rejectReason
            );
            return NextResponse.json({ success: true, data: updated });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
