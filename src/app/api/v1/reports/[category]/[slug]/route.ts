import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { ReportService } from '@/lib/services/report.service';
import { ReportExportService } from '@/lib/services/report-export.service';

const ROUTE_MAP: Record<string, Record<string, (params: any) => Promise<any[]>>> = {
    'employees': {
        'active': (p) => ReportService.getActiveEmployeeList(p),
        'headcount': (p) => ReportService.getHeadcountDemographics(p).then(d => [d]), // Wrap object in array
        'turnover': (p) => ReportService.getTurnoverReport(p),
        'contracts-expiring': (p) => ReportService.getContractsExpiring(p),
        'history': (p) => ReportService.getEmploymentHistory(p),
        'family': (p) => ReportService.getEmployeeFamilyReport(p),
    },
    'attendance': {
        'monthly': (p) => ReportService.getMonthlyAttendanceRecap(p.month, p.year, p),
        'lateness': (p) => ReportService.getLatenessReport(p.month, p.year, p),
        'overtime': (p) => ReportService.getOvertimeReport(p.month, p.year, p),
        'timesheet': (p) => ReportService.getTimesheetDetail(p.month, p.year, p),
    },
    'leave': {
        'balance': (p) => ReportService.getLeaveBalanceReport(p.year, p),
        'history': (p) => ReportService.getLeaveRequestHistory(p),
    },
    'payroll': {
        'payslips': (p) => ReportService.getMonthlyPayslips(p.month, p.year, p),
        'department-recap': (p) => ReportService.getSalaryRecapByDepartment(p.month, p.year),
        'journal': (p) => ReportService.getPayrollJournalEntry(p.month, p.year),
        'bank-file': (p) => ReportService.getBankTransferFile(p.month, p.year),
        'incentives': (p) => ReportService.getIncentiveBonusReport(p.month, p.year, p),
    },
    'tax': {
        'pph21': (p) => ReportService.getMonthlyPPh21(p.month, p.year),
        'form-1721a1': (p) => ReportService.getForm1721A1(p.year),
    },
    'bpjs': {
        'kesehatan': (p) => ReportService.getBpjsKesehatanReport(p.month, p.year),
        'ketenagakerjaan': (p) => ReportService.getBpjsKetenagakerjaanSIPP(p.month, p.year),
    },
    'recruitment': {
        'pipeline': (p) => ReportService.getRecruitmentPipelineReport(p),
    },
    'claims': {
        'summary': (p) => ReportService.getClaimsReport(p),
    },
    'surat': {
        'log': (p) => ReportService.getSuratIssuanceLog(p),
    }
};

export async function GET(
    request: Request,
    { params }: { params: Promise<{ category: string, slug: string }> }
) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const resolvedParams = await params;
        const category = resolvedParams.category;
        const slug = resolvedParams.slug;

        const method = ROUTE_MAP[category]?.[slug];
        if (!method) {
            return NextResponse.json({ error: `Report ${category}/${slug} not found` }, { status: 404 });
        }

        const { searchParams } = new URL(request.url);
        const format = searchParams.get('format') || 'json';
        const queryParams = {
            month: parseInt(searchParams.get('month') || new Date().getMonth() + 1 + ''),
            year: parseInt(searchParams.get('year') || new Date().getFullYear() + ''),
            departmentId: searchParams.get('departmentId') || undefined,
            status: searchParams.get('status') || undefined,
            startDate: searchParams.get('startDate') || undefined,
            endDate: searchParams.get('endDate') || undefined,
        };

        const data = await method(queryParams);

        if (format === 'csv') {
            const columns = data.length > 0 ? Object.keys(data[0]).map(k => ({ header: k, key: k })) : [];
            const csvData = ReportExportService.generateCSV(data, columns);
            return new NextResponse(csvData, {
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': `attachment; filename="${slug}-${Date.now()}.csv"`,
                },
            });
        } 
        
        if (format === 'xlsx') {
            const columns = data.length > 0 ? Object.keys(data[0]).map(k => ({ 
                header: k, 
                key: k,
                type: Array.isArray(data[0][k]) ? 'string' : (typeof data[0][k] === 'number' ? 'number' : 'string') as 'string'|'number'
            })) : [];
            const excelBuffer = await ReportExportService.generateExcel(data, columns, slug);
            return new NextResponse(excelBuffer as unknown as BodyInit, {
                headers: {
                    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'Content-Disposition': `attachment; filename="${slug}-${Date.now()}.xlsx"`,
                },
            });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error(`[REPORT_API_ERROR]`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
