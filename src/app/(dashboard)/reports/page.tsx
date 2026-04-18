"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ReportDownloadDialog } from "@/components/reports/ReportDownloadDialog";
import {
    BarChart3,
    Download,
    FileText,
    Users,
    Clock,
    Wallet,
    CalendarDays,
    Briefcase,
    Receipt,
    Target
} from "lucide-react";

type ReportDef = { 
    name: string; 
    description: string; 
    path: string; 
    formats: ("xlsx" | "csv")[]; 
    filters: ("period" | "department" | "year-only")[]; 
    comingSoon?: boolean;
};

const reportCategories: { title: string, icon: React.ReactNode, accent: string, reports: ReportDef[] }[] = [
    {
        title: "Employee Reports",
        icon: <Users className="h-6 w-6" />,
        accent: "primary",
        reports: [
            { name: "Active Employee List", description: "All employees with active status", path: "employees/active", formats: ["xlsx", "csv"], filters: ["department"] },
            { name: "Headcount & Demographics", description: "Employees by department, gender, type", path: "employees/headcount", formats: ["xlsx", "csv"], filters: ["department"] },
            { name: "Turnover Report", description: "Employee resignations and terminations", path: "employees/turnover", formats: ["xlsx", "csv"], filters: ["period"] },
            { name: "Contracts Expiring Soon", description: "Contract employees needing renewal in 60 days", path: "employees/contracts-expiring", formats: ["xlsx", "csv"], filters: ["department"] },
            { name: "Employment History", description: "Audit trail of role and status changes", path: "employees/history", formats: ["xlsx", "csv"], filters: ["department"] },
            { name: "Employee Dependents", description: "Family members and BPJS dependents", path: "employees/family", formats: ["xlsx", "csv"], filters: ["department"] },
        ]
    },
    {
        title: "Attendance Reports",
        icon: <Clock className="h-6 w-6" />,
        accent: "success",
        reports: [
            { name: "Monthly Attendance Recap", description: "Attendance summary per employee", path: "attendance/monthly", formats: ["xlsx", "csv"], filters: ["period", "department"] },
            { name: "Lateness Report", description: "List of late employees and minutes", path: "attendance/lateness", formats: ["xlsx", "csv"], filters: ["period", "department"] },
            { name: "Overtime Report", description: "Overtime hours per employee", path: "attendance/overtime", formats: ["xlsx", "csv"], filters: ["period", "department"] },
            { name: "Timesheet Detail", description: "Full clock-in/out logs per employee", path: "attendance/timesheet", formats: ["xlsx", "csv"], filters: ["period", "department"] },
        ]
    },
    {
        title: "Leave Reports",
        icon: <CalendarDays className="h-6 w-6" />,
        accent: "primary",
        reports: [
            { name: "Leave Balance Report", description: "Entitlement and remaining balances", path: "leave/balance", formats: ["xlsx", "csv"], filters: ["year-only", "department"] },
            { name: "Leave Request History", description: "Log of all taken leaves", path: "leave/history", formats: ["xlsx", "csv"], filters: ["period", "department"] },
        ]
    },
    {
        title: "Payroll Reports",
        icon: <Wallet className="h-6 w-6" />,
        accent: "warning",
        reports: [
            { name: "Monthly Payslips", description: "Detailed components for all employees", path: "payroll/payslips", formats: ["xlsx", "csv"], filters: ["period", "department"] },
            { name: "Salary Recap per Department", description: "Total cost grouped by department", path: "payroll/department-recap", formats: ["xlsx", "csv"], filters: ["period"] },
            { name: "Journal Entry", description: "Payroll accounting posting summary", path: "payroll/journal", formats: ["csv", "xlsx"], filters: ["period"] },
            { name: "Bank Transfer File", description: "Salary disbursement file for banks", path: "payroll/bank-file", formats: ["csv"], filters: ["period"] },
            { name: "Incentive & Bonus Report", description: "Variable pay and manual deductions", path: "payroll/incentives", formats: ["xlsx", "csv"], filters: ["period", "department"] },
        ]
    },
    {
        title: "Tax & BPJS Reports",
        icon: <FileText className="h-6 w-6" />,
        accent: "accent",
        reports: [
            { name: "Monthly PPh 21 Return", description: "For monthly SPT reporting", path: "tax/pph21", formats: ["xlsx", "csv"], filters: ["period"] },
            { name: "Form 1721-A1", description: "Annual withholding tax slip per employee", path: "tax/form-1721a1", formats: ["xlsx", "csv"], filters: ["year-only"] },
            { name: "BPJS Kesehatan Report", description: "Monthly Health BPJS contribution", path: "bpjs/kesehatan", formats: ["xlsx", "csv"], filters: ["period"] },
            { name: "BPJS Employment (SIPP)", description: "SIPP format for Ketenagakerjaan", path: "bpjs/ketenagakerjaan", formats: ["csv", "xlsx"], filters: ["period"] },
        ]
    },
    {
        title: "Recruitment Reports",
        icon: <Briefcase className="h-6 w-6" />,
        accent: "success",
        reports: [
            { name: "Recruitment Pipeline", description: "Job requisitions and candidate status", path: "recruitment/pipeline", formats: ["xlsx", "csv"], filters: ["department"] },
        ]
    },
    {
        title: "Claims & Surat Reports",
        icon: <Receipt className="h-6 w-6" />,
        accent: "primary",
        reports: [
            { name: "Claims & Expense Recap", description: "Submitted and approved reimbursements", path: "claims/summary", formats: ["xlsx", "csv"], filters: ["period", "department"] },
            { name: "Surat Issuance Log", description: "Official letters generated in period", path: "surat/log", formats: ["xlsx", "csv"], filters: ["period", "department"] },
        ]
    },
    {
        title: "Performance Reports",
        icon: <Target className="h-6 w-6" />,
        accent: "accent",
        reports: [
            { name: "Appraisal Summary", description: "Overall KPI grades", path: "performance/summary", formats: ["xlsx"], filters: [], comingSoon: true },
        ]
    }
];

const accentMap: Record<string, string> = {
    primary: "from-primary/20 to-primary/5 text-primary",
    success: "from-success/20 to-success/5 text-success",
    warning: "from-warning/20 to-warning/5 text-warning",
    accent: "from-accent/20 to-accent/5 text-accent",
};

export default function ReportsPage() {
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
                        <BarChart3 className="h-6 w-6 text-primary" />
                        Reports & Analytics
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Generate and download pre-built HR reports
                    </p>
                </div>
                <Button asChild>
                    <a href="/reports/custom">Custom Report Builder</a>
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {reportCategories.map((cat) => (
                    <Card key={cat.title}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <div className={`p-2 rounded-xl bg-gradient-to-br ${accentMap[cat.accent].split(" ").slice(0, 2).join(" ")}`}>
                                    <span className={accentMap[cat.accent].split(" ").pop()}>{cat.icon}</span>
                                </div>
                                {cat.title}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {cat.reports.map((report) => (
                                    report.comingSoon ? (
                                        <div key={report.name} className="flex items-center justify-between p-3 rounded-xl border border-transparent opacity-60 bg-secondary/20">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-medium text-foreground">{report.name}</p>
                                                    <Badge variant="secondary" className="text-[10px]">Coming Soon</Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground">{report.description}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <ReportDownloadDialog 
                                            key={report.name}
                                            path={report.path}
                                            title={report.name}
                                            description={report.description}
                                            allowedFormats={report.formats}
                                            filters={report.filters}
                                        >
                                            <div className="flex items-center justify-between p-3 rounded-xl border border-transparent hover:border-black/5 dark:hover:border-white/5 hover:bg-secondary/50 hover:shadow-sm cursor-pointer transition-all group">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-foreground">{report.name}</p>
                                                    <p className="text-xs text-muted-foreground">{report.description}</p>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <div className="hidden sm:flex gap-1">
                                                        {report.formats.map(f => (
                                                            <Badge key={f} variant="outline" className="text-[10px] uppercase text-muted-foreground border-border break-keep leading-none px-1.5 py-0.5">{f}</Badge>
                                                        ))}
                                                    </div>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full bg-background/50 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                                                        <Download className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </ReportDownloadDialog>
                                    )
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
