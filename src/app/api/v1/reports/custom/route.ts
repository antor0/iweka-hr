import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { ReportService } from '@/lib/services/report.service';
import { GenerateCustomReportSchema } from '@/lib/validators/report.schema';

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session?.userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const parsed = GenerateCustomReportSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ success: false, error: 'Validation failed', details: parsed.error.format() }, { status: 400 });
        }

        const data = await ReportService.getCustomReportData(parsed.data.module, parsed.data.fields, parsed.data.filters);

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
