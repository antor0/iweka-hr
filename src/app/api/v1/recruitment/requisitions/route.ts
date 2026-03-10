import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { RecruitmentService } from '@/lib/services/recruitment.service';
import { CreateRequisitionSchema } from '@/lib/validators/recruitment.schema';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const departmentId = searchParams.get('departmentId') || undefined;
        const status = searchParams.get('status') || undefined;

        const requisitions = await RecruitmentService.getRequisitions({ departmentId, status });

        return NextResponse.json({
            success: true,
            data: requisitions
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to fetch requisitions' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session?.userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = CreateRequisitionSchema.parse(body);

        const requisition = await RecruitmentService.createRequisition(validatedData as any, session.userId);

        return NextResponse.json({
            success: true,
            data: requisition,
            message: 'Job requisition created successfully'
        }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.issues || error.message || 'Failed to create requisition' },
            { status: 400 }
        );
    }
}
