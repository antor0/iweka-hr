import { NextRequest, NextResponse } from "next/server";
import { OrganizationService } from "@/lib/services/organization.service";
import { WorkTimeModelSchema } from "@/lib/validators/organization.schema";

export async function GET() {
    try {
        const models = await OrganizationService.getWorkTimeModels();
        return NextResponse.json(models);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const validated = WorkTimeModelSchema.parse(body);
        const model = await OrganizationService.createWorkTimeModel(validated);
        return NextResponse.json(model, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}