import { NextRequest, NextResponse } from "next/server";
import { OrganizationService } from "@/lib/services/organization.service";
import { LocationSchema } from "@/lib/validators/organization.schema";

export async function GET() {
    try {
        const locations = await OrganizationService.getLocations();
        return NextResponse.json(locations);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const validated = LocationSchema.parse(body);
        const location = await OrganizationService.createLocation(validated);
        return NextResponse.json(location, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}