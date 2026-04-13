import { NextResponse } from "next/server";
import { DepartmentService } from "@/lib/services/department.service";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const data = await DepartmentService.getDepartmentWorkModels(id);
        return NextResponse.json({ data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { workTimeModelId } = body;
        if (!workTimeModelId) throw new Error("workTimeModelId is required");

        const data = await DepartmentService.assignWorkModel(id, workTimeModelId);
        return NextResponse.json({ data }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { workTimeModelId } = body;
        if (!workTimeModelId) throw new Error("workTimeModelId is required");

        await DepartmentService.removeWorkModel(id, workTimeModelId);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
