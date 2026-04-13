import { NextRequest, NextResponse } from "next/server";
import { OrganizationService } from "@/lib/services/organization.service";
import { PositionGradeSchema } from "@/lib/validators/organization.schema";

export async function GET() {
    try {
        const records = await OrganizationService.getPositionsWithGrades();
        return NextResponse.json(records);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const validated = PositionGradeSchema.parse(body);
        const record = await OrganizationService.upsertPositionGrades(validated);
        return NextResponse.json(record, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}