import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { RecruitmentService } from '@/lib/services/recruitment.service';
import { UpdateApplicationSchema } from '@/lib/validators/recruitment.schema';

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!session?.userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const { id } = await context.params;
        const body = await request.json();
        
        const validatedData = UpdateApplicationSchema.parse(body);

        const app = await RecruitmentService.updateApplication(id, validatedData, session.userId);
        return NextResponse.json({ success: true, data: app });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.issues || error.message }, { status: 400 });
    }
}
