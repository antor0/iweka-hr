import { NextRequest, NextResponse } from "next/server";
import { OrganizationService } from "@/lib/services/organization.service";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await OrganizationService.deleteApprovalWorkflow(id);
        return new NextResponse(null, { status: 204 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}