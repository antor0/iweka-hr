import { prisma } from "@/lib/db/prisma";

export class ReportService {
    static async getCustomReportData(module: string, fields: string[], filters: any) {
        // Build the basic where clause
        const where: any = {};

        let data: any[] = [];

        // Build a prisma select object dynamically from the dotted field paths
        const selectObj: any = {};
        for (const field of fields) {
            const parts = field.split('.');
            let current = selectObj;
            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                if (i === parts.length - 1) {
                    current[part] = true;
                } else {
                    if (!current[part]) current[part] = { select: {} };
                    current = current[part].select;
                }
            }
        }

        switch (module) {
            case 'employees':
                if (filters.departmentId) where.departmentId = filters.departmentId;
                if (filters.employmentStatus) where.employmentStatus = filters.employmentStatus;
                data = await prisma.employee.findMany({ where, select: selectObj });
                break;

            case 'attendance':
                if (filters.startDate && filters.endDate) {
                    where.date = { gte: new Date(filters.startDate), lte: new Date(filters.endDate) };
                }
                data = await prisma.attendance.findMany({ where, select: selectObj, orderBy: { date: 'desc' }, take: 5000 });
                break;

            case 'leave':
                if (filters.status) where.status = filters.status;
                data = await prisma.leaveRequest.findMany({ where, select: selectObj, orderBy: { startDate: 'desc' }, take: 5000 });
                break;

            case 'payroll':
                if (filters.periodMonth) where.payrollRun = { periodMonth: parseInt(filters.periodMonth) };
                if (filters.periodYear) where.payrollRun = { ...where.payrollRun, periodYear: parseInt(filters.periodYear) };
                data = await prisma.payrollItem.findMany({ where, select: selectObj, take: 5000 });
                break;

            default:
                throw new Error(`Unsupported module: ${module}`);
        }

        // Map the complex nested data into a flat structure based on the requested fields
        return data.map((item) => {
            const row: Record<string, any> = {};
            fields.forEach(field => {
                // Handle nested fields like 'employee.fullName' or 'department.name'
                if (field.includes('.')) {
                    const parts = field.split('.');
                    let val = item;
                    for (const p of parts) {
                        val = val ? val[p] : null;
                    }
                    row[field] = val;
                } else {
                    row[field] = item[field];
                }
            });
            return row;
        });
    }
}
