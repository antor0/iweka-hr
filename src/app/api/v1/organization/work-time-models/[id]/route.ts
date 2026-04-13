import { NextRequest, NextResponse } from "next/server";
import { OrganizationService } from "@/lib/services/organization.service";
import { WorkTimeModelSchema } from "@/lib/validators/organization.schema";

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const body = await request.json();
        const validated = WorkTimeModelSchema.parse(body);
        
        const model = await OrganizationService.updateWorkTimeModel(resolvedParams.id, validated);
        return NextResponse.json({ success: true, data: model });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        await OrganizationService.deleteWorkTimeModel(resolvedParams.id);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}