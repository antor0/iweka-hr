import { prisma } from "@/lib/db/prisma";

export class ReportService {
    // ---------------------------------------------------------
    // CUSTOM
    // ---------------------------------------------------------
    static async getCustomReportData(module: string, fields: string[], filters: any) {
        const where: any = {};
        let data: any[] = [];
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

        return data.map((item) => {
            const row: Record<string, any> = {};
            fields.forEach(field => {
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

    // ---------------------------------------------------------
    // 1. EMPLOYEE REPORTS
    // ---------------------------------------------------------
    static async getActiveEmployeeList(filters: any = {}) {
        const where: any = { employmentStatus: "ACTIVE" };
        if (filters.departmentId) where.departmentId = filters.departmentId;

        const employees = await prisma.employee.findMany({
            where,
            include: { department: true, position: true, grade: true, location: true, manager: true }
        });

        return employees.map(e => ({
            "Employee Number": e.employeeNumber,
            "Full Name": e.fullName,
            "Email": e.email,
            "Phone": e.phone || '',
            "Department": e.department?.name || '',
            "Position": e.position?.title || '',
            "Grade": e.grade?.name || '',
            "Location": e.location?.name || '',
            "Hire Date": e.hireDate,
            "Type": e.employmentType,
            "Status": e.employmentStatus,
            "Manager": e.manager?.fullName || '',
            "Base Salary": e.baseSalary || e.grade?.minSalary || 0
        }));
    }

    static async getHeadcountDemographics(filters: any = {}) {
        const where: any = { employmentStatus: "ACTIVE" };
        if (filters.departmentId) where.departmentId = filters.departmentId;

        const employees = await prisma.employee.findMany({
            where,
            include: { department: true }
        });

        // Grouping
        const byDept: Record<string, number> = {};
        let males = 0, females = 0;
        let permanent = 0, contract = 0, intern = 0;

        employees.forEach(e => {
            const dept = e.department?.name || 'Unassigned';
            byDept[dept] = (byDept[dept] || 0) + 1;
            
            if (e.gender === 'MALE') males++;
            if (e.gender === 'FEMALE') females++;

            if (e.employmentType === 'PERMANENT') permanent++;
            if (e.employmentType === 'CONTRACT') contract++;
            if (e.employmentType === 'INTERN') intern++;
        });

        return {
            totalHeadcount: employees.length,
            demographics: {
                gender: { MALE: males, FEMALE: females },
                type: { PERMANENT: permanent, CONTRACT: contract, INTERN: intern },
                department: byDept
            }
        };
    }

    static async getTurnoverReport(filters: any = {}) {
        const where: any = {};
        if (filters.month && filters.year) {
            const startDate = new Date(parseInt(filters.year), parseInt(filters.month) - 1, 1);
            const endDate = new Date(parseInt(filters.year), parseInt(filters.month), 0);
            where.effectiveDate = { gte: startDate, lte: endDate };
        }
        where.changeType = 'STATUS_CHANGE';

        const history = await prisma.employmentHistory.findMany({
            where,
            include: { employee: { include: { department: true } } }
        });

        const turnovers = history.filter(h => {
            const oldStatus = (h.oldValue as any)?.employmentStatus;
            const newStatus = (h.newValue as any)?.employmentStatus;
            return oldStatus !== newStatus && (newStatus === 'RESIGNED' || newStatus === 'TERMINATED');
        });

        return turnovers.map(t => ({
            "Employee Number": t.employee.employeeNumber,
            "Name": t.employee.fullName,
            "Department": t.employee.department?.name || '',
            "Hire Date": t.employee.hireDate,
            "Termination Date": t.effectiveDate,
            "Tenure (Days)": Math.floor((new Date(t.effectiveDate).getTime() - new Date(t.employee.hireDate).getTime()) / (1000 * 3600 * 24)),
            "Status": (t.newValue as any)?.employmentStatus,
            "Reason": t.reason || ''
        }));
    }

    static async getContractsExpiring(filters: any = {}) {
        const where: any = { employmentType: "CONTRACT", employmentStatus: "ACTIVE" };
        if (filters.departmentId) where.departmentId = filters.departmentId;

        // Find contracts expiring in the next 60 days
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + 60);

        where.contractEndDate = { lte: targetDate, not: null };

        const employees = await prisma.employee.findMany({
            where,
            include: { department: true }
        });

        return employees.map(e => ({
            "Employee Number": e.employeeNumber,
            "Name": e.fullName,
            "Department": e.department?.name || '',
            "Hire Date": e.hireDate,
            "Contract End Date": e.contractEndDate,
            "Days Remaining": e.contractEndDate ? Math.ceil((new Date(e.contractEndDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : 0
        })).sort((a, b) => a["Days Remaining"] - b["Days Remaining"]);
    }

    static async getEmploymentHistory(filters: any = {}) {
        const where: any = {};
        if (filters.departmentId) where.employee = { departmentId: filters.departmentId };

        const history = await prisma.employmentHistory.findMany({
            where,
            include: { employee: { include: { department: true } }, approvedBy: true },
            orderBy: { effectiveDate: 'desc' }
        });

        return history.map(h => ({
            "Employee": h.employee.fullName,
            "Department": h.employee.department?.name || '',
            "Date": h.effectiveDate,
            "Type": h.changeType,
            "From": JSON.stringify(h.oldValue),
            "To": JSON.stringify(h.newValue),
            "Reason": h.reason || '',
            "Approved By": h.approvedBy?.fullName || ''
        }));
    }

    static async getEmployeeFamilyReport(filters: any = {}) {
        const where: any = {};
        if (filters.departmentId) where.employee = { departmentId: filters.departmentId };

        const members = await prisma.familyMember.findMany({
            where,
            include: { employee: { include: { department: true } } }
        });

        return members.map(m => ({
            "Employee Number": m.employee.employeeNumber,
            "Employee Name": m.employee.fullName,
            "Department": m.employee.department?.name || '',
            "Family Name": m.fullName,
            "Relationship": m.relationship,
            "Date of Birth": m.dateOfBirth,
            "NIK": !!m.nik ? "Provided" : "Missing",
            "BPJS Dependent": m.isBpjsDependent ? "Yes" : "No"
        }));
    }

    // ---------------------------------------------------------
    // 2. ATTENDANCE REPORTS
    // ---------------------------------------------------------
    static async getMonthlyAttendanceRecap(month: number, year: number, filters: any = {}) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        
        const where: any = { date: { gte: startDate, lte: endDate } };
        if (filters.departmentId) where.employee = { departmentId: filters.departmentId };

        const timesheets = await prisma.timesheet.findMany({
            where,
            include: { employee: { include: { department: true } } }
        });

        const empMap: Record<string, any> = {};

        timesheets.forEach(ts => {
            if (!empMap[ts.employeeId]) {
                empMap[ts.employeeId] = {
                    "Employee Number": ts.employee.employeeNumber,
                    "Name": ts.employee.fullName,
                    "Department": ts.employee.department?.name || '',
                    "Present": 0,
                    "Late": 0,
                    "Absent": 0,
                    "Leave": 0,
                    "Holiday": 0,
                    "Off Day": 0,
                    "Total Work Hours": 0,
                    "Total Late Min": 0,
                    "Total OT Hours": 0
                };
            }
            
            const e = empMap[ts.employeeId];
            if (ts.status === 'PRESENT' && ts.lateMinutes && ts.lateMinutes > 0) e["Late"]++;
            else if (ts.status === 'PRESENT') e["Present"]++;
            else if (ts.status === 'LATE') e["Late"]++;
            else if (ts.status === 'ABSENT') e["Absent"]++;
            else if (ts.status === 'LEAVE') e["Leave"]++;
            else if (ts.status === 'HOLIDAY') e["Holiday"]++;
            else if (ts.status === 'OFF_DAY') e["Off Day"]++;

            e["Total Work Hours"] += Number(ts.workHours || 0);
            e["Total OT Hours"] += Number(ts.overtimeHours || 0);
            e["Total Late Min"] += ts.lateMinutes || 0;
        });

        return Object.values(empMap);
    }

    static async getLatenessReport(month: number, year: number, filters: any = {}) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        
        const where: any = { 
            date: { gte: startDate, lte: endDate },
            lateMinutes: { gt: 0 }
        };
        if (filters.departmentId) where.employee = { departmentId: filters.departmentId };

        const timesheets = await prisma.timesheet.findMany({
            where,
            include: { employee: { include: { department: true } } },
            orderBy: { date: 'asc' }
        });

        return timesheets.map(t => ({
            "Date": t.date,
            "Employee Number": t.employee.employeeNumber,
            "Name": t.employee.fullName,
            "Department": t.employee.department?.name || '',
            "Scheduled Start": t.scheduledStart || '',
            "Actual In": t.actualClockIn,
            "Late Mins": t.lateMinutes || 0,
            "Status": t.status
        }));
    }

    static async getOvertimeReport(month: number, year: number, filters: any = {}) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        
        const where: any = { date: { gte: startDate, lte: endDate } };
        if (filters.departmentId) where.employee = { departmentId: filters.departmentId };

        const requests = await prisma.overtimeRequest.findMany({
            where,
            include: { employee: { include: { department: true } }, approvedBy: true },
            orderBy: { date: 'asc' }
        });

        return requests.map(r => ({
            "Date": r.date,
            "Employee Number": r.employee.employeeNumber,
            "Name": r.employee.fullName,
            "Department": r.employee.department?.name || '',
            "Planned Hours": r.plannedHours,
            "Actual Hours": r.actualHours || 0,
            "Reason": r.reason,
            "Status": r.status,
            "Approved By": r.approvedBy?.fullName || ''
        }));
    }

    static async getTimesheetDetail(month: number, year: number, filters: any = {}) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        
        const where: any = { date: { gte: startDate, lte: endDate } };
        if (filters.departmentId) where.employee = { departmentId: filters.departmentId };

        const timesheets = await prisma.timesheet.findMany({
            where,
            include: { employee: { include: { department: true } } },
            orderBy: [{ employeeId: 'asc' }, { date: 'asc' }]
        });

        return timesheets.map(t => ({
            "Employee Number": t.employee.employeeNumber,
            "Name": t.employee.fullName,
            "Department": t.employee.department?.name || '',
            "Date": t.date,
            "Scheduled Time": `${t.scheduledStart || '-'} to ${t.scheduledEnd || '-'}`,
            "Actual In": t.actualClockIn,
            "Actual Out": t.actualClockOut,
            "Work Hours": t.workHours,
            "Late Mins": t.lateMinutes || 0,
            "Status": t.status,
            "Notes": t.notes || ''
        }));
    }

    // ---------------------------------------------------------
    // 3. LEAVE REPORTS
    // ---------------------------------------------------------
    static async getLeaveBalanceReport(year: number, filters: any = {}) {
        const where: any = { year };
        if (filters.departmentId) where.employee = { departmentId: filters.departmentId };

        const balances = await prisma.leaveBalance.findMany({
            where,
            include: { employee: { include: { department: true } }, leaveType: true }
        });

        return balances.map(b => ({
            "Employee Number": b.employee.employeeNumber,
            "Name": b.employee.fullName,
            "Department": b.employee.department?.name || '',
            "Leave Type": b.leaveType.name,
            "Year": b.year,
            "Entitlement": b.entitlement,
            "Carry Over": b.carryOver,
            "Total Available": Number(b.entitlement) + Number(b.carryOver),
            "Used": b.used,
            "Remaining": (Number(b.entitlement) + Number(b.carryOver)) - Number(b.used)
        }));
    }

    static async getLeaveRequestHistory(filters: any = {}) {
        const where: any = {};
        if (filters.month && filters.year) {
            const startDate = new Date(parseInt(filters.year), parseInt(filters.month) - 1, 1);
            const endDate = new Date(parseInt(filters.year), parseInt(filters.month), 0);
            where.startDate = { gte: startDate, lte: endDate };
        }
        if (filters.departmentId) where.employee = { departmentId: filters.departmentId };

        const requests = await prisma.leaveRequest.findMany({
            where,
            include: { employee: { include: { department: true } }, leaveType: true, approvedBy: true },
            orderBy: { startDate: 'desc' }
        });

        return requests.map(r => ({
            "Employee Number": r.employee.employeeNumber,
            "Name": r.employee.fullName,
            "Department": r.employee.department?.name || '',
            "Leave Type": r.leaveType.name,
            "Start Date": r.startDate,
            "End Date": r.endDate,
            "Total Days": r.totalDays,
            "Status": r.status,
            "Reason": r.reason,
            "Approved By": r.approvedBy?.fullName || ''
        }));
    }

    // ---------------------------------------------------------
    // 4. PAYROLL REPORTS
    // ---------------------------------------------------------
    static async getMonthlyPayslips(month: number, year: number, filters: any = {}) {
        const where: any = { payrollRun: { periodMonth: month, periodYear: year } };
        if (filters.departmentId) where.employee = { departmentId: filters.departmentId };

        const items = await prisma.payrollItem.findMany({
            where,
            include: { employee: { include: { department: true } } }
        });

        return items.map(i => ({
            "Employee Number": i.employee.employeeNumber,
            "Name": i.employee.fullName,
            "Department": i.employee.department?.name || '',
            "Basic Salary": i.basicSalary,
            "Allowances": i.totalAllowances,
            "Overtime": i.totalOvertime,
            "Incentives": i.totalIncentives,
            "Gross Income": i.grossIncome,
            "PPh21 Tax": i.pph21Amount,
            "BPJS Kes (Emp)": i.bpjsKesEmployee,
            "BPJS TK (Emp)": Number(i.bpjsTkJhtEmployee) + Number(i.bpjsTkJpEmployee),
            "Total Deductions": i.totalDeductions,
            "Net Salary": i.netSalary
        }));
    }

    static async getSalaryRecapByDepartment(month: number, year: number) {
        const items = await prisma.payrollItem.findMany({
            where: { payrollRun: { periodMonth: month, periodYear: year } },
            include: { employee: { include: { department: true } } }
        });

        const deptMap: Record<string, any> = {};

        items.forEach(i => {
            const dept = i.employee.department?.name || 'Unassigned';
            if (!deptMap[dept]) {
                deptMap[dept] = {
                    "Department": dept,
                    "Total Employees": 0,
                    "Basic Salary": 0,
                    "Gross Income": 0,
                    "Tax PPh21": 0,
                    "BPJS Company": 0,
                    "BPJS Employee": 0,
                    "Net Salary": 0
                };
            }
            
            const d = deptMap[dept];
            d["Total Employees"]++;
            d["Basic Salary"] += Number(i.basicSalary);
            d["Gross Income"] += Number(i.grossIncome);
            d["Tax PPh21"] += Number(i.pph21Amount);
            d["BPJS Company"] += Number(i.bpjsKesCompany) + Number(i.bpjsTkJhtCompany) + Number(i.bpjsTkJpCompany) + Number(i.bpjsTkJkkCompany) + Number(i.bpjsTkJkmCompany);
            d["BPJS Employee"] += Number(i.bpjsKesEmployee) + Number(i.bpjsTkJhtEmployee) + Number(i.bpjsTkJpEmployee);
            d["Net Salary"] += Number(i.netSalary);
        });

        return Object.values(deptMap);
    }

    static async getPayrollJournalEntry(month: number, year: number) {
        const items = await prisma.payrollItem.findMany({
            where: { payrollRun: { periodMonth: month, periodYear: year } },
            include: { employee: { include: { department: true } } }
        });

        const j: any[] = [];
        let totalGross = 0;
        let totalCompanyBpjs = 0;
        let totalTax = 0;
        let totalEmployeeBpjs = 0;
        let totalNet = 0;

        items.forEach(i => {
            totalGross += Number(i.grossIncome);
            totalCompanyBpjs += Number(i.bpjsKesCompany) + Number(i.bpjsTkJhtCompany) + Number(i.bpjsTkJpCompany) + Number(i.bpjsTkJkkCompany) + Number(i.bpjsTkJkmCompany);
            totalTax += Number(i.pph21Amount);
            totalEmployeeBpjs += Number(i.bpjsKesEmployee) + Number(i.bpjsTkJhtEmployee) + Number(i.bpjsTkJpEmployee);
            totalNet += Number(i.netSalary);
        });

        if (items.length > 0) {
            j.push({ Account: "Salary Expense", Dr: totalGross, Cr: 0, Description: "Total Gross Salary" });
            j.push({ Account: "BPJS Company Expense", Dr: totalCompanyBpjs, Cr: 0, Description: "Total Employer BPJS" });
            j.push({ Account: "PPh 21 Payable", Dr: 0, Cr: totalTax, Description: "Tax Withheld" });
            j.push({ Account: "BPJS Payable", Dr: 0, Cr: totalCompanyBpjs + totalEmployeeBpjs, Description: "Company + Employee BPJS Liability" });
            j.push({ Account: "Salary Payable", Dr: 0, Cr: totalNet, Description: "Net Salary Payable to Employees" });
        }

        return j;
    }

    static async getBankTransferFile(month: number, year: number) {
        const run = await prisma.payrollRun.findFirst({
            where: { periodMonth: month, periodYear: year, status: { in: ['FINALIZED', 'APPROVED'] } },
            include: { items: { include: { employee: true } } }
        });

        if (!run) return [];

        return run.items.map(i => ({
            "Account Number": i.employee.bankAccount || '',
            "Bank Name": i.employee.bankName || '',
            "Employee Name": i.employee.fullName,
            "Amount": Number(i.netSalary),
            "Currency": "IDR",
            "Description": `Salary ${month}/${year}`
        })).filter(r => r["Account Number"] !== '');
    }

    static async getIncentiveBonusReport(month: number, year: number, filters: any = {}) {
        const where: any = { 
            payrollRun: { periodMonth: month, periodYear: year }
        };
        
        if (filters.departmentId) {
            where.employee = { departmentId: filters.departmentId };
        }

        const items = await prisma.payrollItem.findMany({
            where,
            include: { employee: { include: { department: true } } }
        });

        return items.map(item => {
            const comp = item.components as any || {};
            const earnings = comp.earnings || {};
            const deductions = comp.deductions || {};
            const varInputs = earnings.variableInputs || {};
            const incentives = earnings.incentives || {};

            return {
                "Employee Number": item.employee.employeeNumber,
                "Name": item.employee.fullName,
                "Department": item.employee.department?.name || '',
                "Incentive": Number(incentives.incentive || 0),
                "Bonus": Number(incentives.bonus || varInputs.bonus || 0),
                "THR": Number(varInputs.thr || 0),
                "Commission": Number(varInputs.commission || 0),
                "Overtime Pay": Number(varInputs.overtime || 0),
                "Manual Deduction": Number(deductions.manualDeduction || 0)
            };
        });
    }

    // ---------------------------------------------------------
    // 5. TAX & BPJS REPORTS
    // ---------------------------------------------------------
    static async getMonthlyPPh21(month: number, year: number) {
        const taxes = await prisma.monthlyTax.findMany({
            where: { month, year },
            include: { 
                employee: { include: { department: true } },
                config: true
            }
        });

        return taxes.map(t => ({
            "Employee Number": t.employee.employeeNumber,
            "Name": t.employee.fullName,
            "NPWP": t.employee.npwp || '',
            "NPWP Status": t.employee.npwp ? 'Valid' : 'Non-NPWP',
            "PTKP Status": t.ptkpStatus,
            "Gross Income": t.grossIncome,
            "Taxable Income": t.taxableIncome,
            "Tax Required": t.taxAmount,
            "Method Used": t.config?.method || 'UNKNOWN',
            "YTD Gross": t.ytdGross,
            "YTD Tax": t.ytdTax
        }));
    }

    static async getBpjsKesehatanReport(month: number, year: number) {
        const items = await prisma.payrollItem.findMany({
            where: { payrollRun: { periodMonth: month, periodYear: year } },
            include: { employee: { include: { families: true } } }
        });

        return items.map(i => {
            const dependentsCount = i.employee.families.filter(f => f.isBpjsDependent).length;
            return {
                "Employee Number": i.employee.employeeNumber,
                "Name": i.employee.fullName,
                "BPJS Kes Number": i.employee.bpjsKesNumber || 'Missing',
                "Base Salary": i.basicSalary,
                "Dependents Covered": dependentsCount,
                "Employee Deduction (1%)": i.bpjsKesEmployee,
                "Company Contribution (4%)": i.bpjsKesCompany,
                "Total BPJS Kes": Number(i.bpjsKesEmployee) + Number(i.bpjsKesCompany)
            };
        });
    }

    static async getBpjsKetenagakerjaanSIPP(month: number, year: number) {
        const items = await prisma.payrollItem.findMany({
            where: { payrollRun: { periodMonth: month, periodYear: year } },
            include: { employee: true }
        });

        return items.map(i => ({
            "Employee Number": i.employee.employeeNumber,
            "Name": i.employee.fullName,
            "BPJS TK Number": i.employee.bpjsTkNumber || 'Missing',
            "Base Salary": i.basicSalary,
            "JHT Employee (2%)": i.bpjsTkJhtEmployee,
            "JHT Company (3.7%)": i.bpjsTkJhtCompany,
            "JP Employee (1%)": i.bpjsTkJpEmployee,
            "JP Company (2%)": i.bpjsTkJpCompany,
            "JKK Company": i.bpjsTkJkkCompany,
            "JKM Company": i.bpjsTkJkmCompany,
            "Total Company": Number(i.bpjsTkJhtCompany) + Number(i.bpjsTkJpCompany) + Number(i.bpjsTkJkkCompany) + Number(i.bpjsTkJkmCompany)
        }));
    }

    static async getForm1721A1(year: number) {
        // Find maximum YTD records for each employee in the year
        // We do this by getting all taxes for december, or the last month they were employed
        const lastTaxes = await prisma.monthlyTax.groupBy({
            by: ['employeeId'],
            where: { year },
            _max: { month: true }
        });

        const taxRecords = [];
        for (const t of lastTaxes) {
            if (t._max.month) {
                const record = await prisma.monthlyTax.findFirst({
                    where: { employeeId: t.employeeId, year, month: t._max.month },
                    include: { employee: { include: { department: true } } }
                });
                if (record) taxRecords.push(record);
            }
        }

        return taxRecords.map(t => ({
            "Employee Number": t.employee.employeeNumber,
            "Name": t.employee.fullName,
            "NPWP": t.employee.npwp || 'Missing',
            "PTKP Status": t.ptkpStatus,
            "Annual Gross": t.ytdGross,
            "Annual Tax": t.ytdTax,
            "Marital Status": t.employee.maritalStatus
        }));
    }

    // ---------------------------------------------------------
    // 6. RECRUITMENT REPORTS
    // ---------------------------------------------------------
    static async getRecruitmentPipelineReport(filters: any = {}) {
        const where: any = {};
        if (filters.departmentId) where.departmentId = filters.departmentId;

        const reqs = await prisma.jobRequisition.findMany({
            where,
            include: { 
                department: true,
                position: true,
                applications: true
            }
        });

        return reqs.map(r => {
            const apps = r.applications;
            return {
                "Requisition ID": r.id.substring(0,8),
                "Job Title": r.title,
                "Department": r.department.name,
                "Position": r.position.title,
                "Status": r.status,
                "Total Headcount": r.headcount,
                "Total Applicants": apps.length,
                "Stage NEW": apps.filter(a => a.status === 'NEW').length,
                "Stage SCREENING": apps.filter(a => a.status === 'SCREENING').length,
                "Stage INTERVIEW": apps.filter(a => a.status === 'INTERVIEW').length,
                "Stage OFFER": apps.filter(a => a.status === 'OFFER').length,
                "Stage HIRED": apps.filter(a => a.status === 'HIRED').length,
                "Stage REJECTED/WITHDRAWN": apps.filter(a => ['REJECTED', 'WITHDRAWN'].includes(a.status)).length,
            };
        });
    }

    // ---------------------------------------------------------
    // 7. CLAIMS & SURAT
    // ---------------------------------------------------------
    static async getClaimsReport(filters: any = {}) {
        const where: any = {};
        if (filters.month && filters.year) {
            const startDate = new Date(parseInt(filters.year), parseInt(filters.month) - 1, 1);
            const endDate = new Date(parseInt(filters.year), parseInt(filters.month), 0);
            where.submittedAt = { gte: startDate, lte: endDate };
        }
        if (filters.departmentId) where.employee = { departmentId: filters.departmentId };

        const claims = await prisma.claim.findMany({
            where,
            include: { employee: { include: { department: true } }, approvedBy: true }
        });

        return claims.map(c => ({
            "Claim Number": c.claimNumber,
            "Employee": c.employee.fullName,
            "Department": c.employee.department?.name || '',
            "Title": c.title,
            "Total Amount": c.totalAmount,
            "Status": c.status,
            "Submitted At": c.submittedAt,
            "Approved By": c.approvedBy?.fullName || ''
        }));
    }

    static async getSuratIssuanceLog(filters: any = {}) {
        const where: any = {};
        if (filters.month && filters.year) {
            const startDate = new Date(parseInt(filters.year), parseInt(filters.month) - 1, 1);
            const endDate = new Date(parseInt(filters.year), parseInt(filters.month), 0);
            where.issuedDate = { gte: startDate, lte: endDate };
        }
        if (filters.departmentId) where.employee = { departmentId: filters.departmentId };

        const logs = await prisma.suratHistory.findMany({
            where,
            include: { employee: { include: { department: true } }, template: true, createdBy: true }
        });

        return logs.map(s => ({
            "Surat Number": s.suratNumber,
            "Type": s.template.name || 'Unknown',
            "Employee": s.employee.fullName,
            "Department": s.employee.department?.name || '',
            "Issued Date": s.issuedDate,
            "Notes": s.notes || '',
            "Generated By": s.createdBy?.email || 'System'
        }));
    }
}
