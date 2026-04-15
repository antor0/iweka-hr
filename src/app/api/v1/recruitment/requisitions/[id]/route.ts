import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { RecruitmentService } from '@/lib/services/recruitment.service';
import { z } from 'zod';

const UpdateRequisitionSchema = z.object({
    title: z.string().min(3).optional(),
    description: z.string().optional(),
    requirements: z.string().optional(),
    location: z.string().optional(),
});

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const requisition = await RecruitmentService.getRequisitionById(id);

        if (!requisition) {
            return NextResponse.json({ success: false, error: 'Requisition not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: requisition });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!session?.userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const { id } = await context.params;
        const body = await request.json();
        const validatedData = UpdateRequisitionSchema.parse(body);

        const requisition = await RecruitmentService.updateRequisition(id, validatedData, session.userId);

        return NextResponse.json({ success: true, data: requisition });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.issues || error.message }, { status: 400 });
    }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!session?.userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const { id } = await context.params;
        const req = await RecruitmentService.deleteRequisition(id, session.userId);

        return NextResponse.json({ success: true, data: req });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
