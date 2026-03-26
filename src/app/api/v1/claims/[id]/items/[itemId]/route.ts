import { NextRequest, NextResponse } from "next/server";
import { ClaimsService } from "@/lib/services/claims.service";
import { getSession } from "@/lib/auth/session";

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string; itemId: string }> }
) {
    try {
        const session = await getSession();
        if (!session || !session.employeeId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: claimId, itemId } = await params;

        // Verify ownership
        const claim = await ClaimsService.getClaimById(claimId);
        if (!claim) return NextResponse.json({ error: "Claim not found" }, { status: 404 });
        if (claim.employeeId !== session.employeeId && session.role !== "SYSTEM_ADMIN" && session.role !== "HR_ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await ClaimsService.deleteClaimItem(claimId, itemId);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
