import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { ReportService } from '@/lib/services/report.service';
import { GenerateCustomReportSchema } from '@/lib/validators/report.schema';
import { ReportExportService } from '@/lib/services/report-export.service';

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

        const { searchParams } = new URL(request.url);
        const format = searchParams.get('format');

        if (format === 'csv') {
            const columns = parsed.data.fields.map((f: string) => ({ header: f, key: f }));
            const csvData = ReportExportService.generateCSV(data, columns);
            return new NextResponse(csvData, {
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': `attachment; filename="custom-${parsed.data.module}-${Date.now()}.csv"`,
                },
            });
        } 
        
        if (format === 'xlsx') {
            const columns = parsed.data.fields.map((f: string) => ({ 
                header: f, 
                key: f,
                type: (data.length > 0 && typeof data[0][f] === 'number') ? 'number' : 'string' as 'string'|'number'
            }));
            const excelBuffer = await ReportExportService.generateExcel(data, columns, `Custom_${parsed.data.module}`);
            return new NextResponse(excelBuffer as unknown as BodyInit, {
                headers: {
                    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'Content-Disposition': `attachment; filename="custom-${parsed.data.module}-${Date.now()}.xlsx"`,
                },
            });
        }

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
