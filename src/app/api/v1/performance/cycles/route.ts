import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { PerformanceService } from '@/lib/services/performance.service';
import { CreateCycleSchema } from '@/lib/validators/performance.schema';

export async function GET() {
    try {
        const session = await getSession();
        if (!session?.userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const cycles = await PerformanceService.getCycles();
        return NextResponse.json({ success: true, data: cycles });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session?.userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const parsed = CreateCycleSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ success: false, error: 'Validation failed', details: parsed.error.format() }, { status: 400 });
        }

        const cycle = await PerformanceService.createCycle(parsed.data, session.userId);
        return NextResponse.json({ success: true, data: cycle }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
