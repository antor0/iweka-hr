import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { PerformanceService } from '@/lib/services/performance.service';
import { UpdateAppraisalStatusSchema } from '@/lib/validators/performance.schema';

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!session?.userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const { id } = await context.params;

        const body = await request.json();
        const parsed = UpdateAppraisalStatusSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ success: false, error: 'Validation failed', details: parsed.error.format() }, { status: 400 });
        }

        const appraisal = await PerformanceService.updateAppraisalStatus(id, parsed.data, session.userId);
        return NextResponse.json({ success: true, data: appraisal });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
