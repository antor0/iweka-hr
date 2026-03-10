import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { RecruitmentService } from '@/lib/services/recruitment.service';

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!session?.userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const { id } = await context.params;
        const body = await request.json();
        const { status } = body;

        if (!status) return NextResponse.json({ success: false, error: 'Status is required' }, { status: 400 });

        const req = await RecruitmentService.updateRequisitionStatus(id, status, session.userId);

        return NextResponse.json({ success: true, data: req });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
