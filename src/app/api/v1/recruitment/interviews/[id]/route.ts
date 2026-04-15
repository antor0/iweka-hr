import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { RecruitmentService } from '@/lib/services/recruitment.service';
import { UpdateInterviewSchema } from '@/lib/validators/recruitment.schema';

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!session?.userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const { id } = await context.params;
        const body = await request.json();
        const validatedData = UpdateInterviewSchema.parse(body);

        const interview = await RecruitmentService.updateInterview(id, validatedData);
        return NextResponse.json({ success: true, data: interview });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.issues || error.message }, { status: 400 });
    }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!session?.userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const { id } = await context.params;
        await RecruitmentService.deleteInterview(id);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
