import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { PerformanceService } from '@/lib/services/performance.service';
import { CreateAppraisalSchema } from '@/lib/validators/performance.schema';

export async function GET(request: Request) {
    try {
        const session = await getSession();
        if (!session?.userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const cycleId = searchParams.get("cycleId");
        const employeeId = searchParams.get("employeeId") || undefined;
        const managerId = searchParams.get("managerId") || undefined;

        if (!cycleId) {
            return NextResponse.json({ success: false, error: 'cycleId is required' }, { status: 400 });
        }

        const appraisals = await PerformanceService.getAppraisalsByCycle(cycleId, employeeId, managerId);
        return NextResponse.json({ success: true, data: appraisals });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session?.userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const parsed = CreateAppraisalSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ success: false, error: 'Validation failed', details: parsed.error.format() }, { status: 400 });
        }

        const appraisal = await PerformanceService.createAppraisal(parsed.data, session.userId);
        return NextResponse.json({ success: true, data: appraisal }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
