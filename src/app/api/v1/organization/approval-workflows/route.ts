import { NextRequest, NextResponse } from "next/server";
import { OrganizationService } from "@/lib/services/organization.service";
import { ApprovalWorkflowSchema } from "@/lib/validators/organization.schema";

export async function GET() {
    try {
        const workflows = await OrganizationService.getApprovalWorkflows();
        return NextResponse.json(workflows);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const validated = ApprovalWorkflowSchema.parse(body);
        const workflow = await OrganizationService.upsertApprovalWorkflow(validated);
        return NextResponse.json(workflow, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { departmentId, headId } = body;
        
        if (!departmentId || !headId) {
            return NextResponse.json({ error: "departmentId and headId are required" }, { status: 400 });
        }
        
        const workflows = await OrganizationService.bulkUpsertApprovalWorkflows(departmentId, headId);
        return NextResponse.json(workflows);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}