"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassStatCard } from "@/components/liquid-glass/glass-stat-card";
import { formatIDR } from "@/lib/utils";
import {
    BarChart3,
    Download,
    FileText,
    Users,
    TrendingUp,
    Clock,
    Wallet,
    ArrowRight,
} from "lucide-react";

const reportCategories = [
    {
        title: "Employee Reports",
        icon: <Users className="h-6 w-6" />,
        reports: [
            { name: "Headcount & Demographics", description: "Number of employees by department, gender, age", type: "PDF / Excel" },
            { name: "Active Employee List", description: "All employees with active status", type: "Excel" },
            { name: "Turnover Report", description: "Employee turnover analysis", type: "PDF" },
            { name: "Contracts Expiring Soon", description: "Contract employees needing renewal", type: "Excel" },
        ],
        accent: "primary",
    },
    {
        title: "Attendance Reports",
        icon: <Clock className="h-6 w-6" />,
        reports: [
            { name: "Monthly Attendance Recap", description: "Attendance summary per employee", type: "Excel" },
            { name: "Lateness Report", description: "List of late employees", type: "PDF / Excel" },
            { name: "Overtime Report", description: "Overtime hours recap per employee", type: "Excel" },
        ],
        accent: "success",
    },
    {
        title: "Payroll Reports",
        icon: <Wallet className="h-6 w-6" />,
        reports: [
            { name: "Monthly Payslips", description: "Payslips for all employees", type: "PDF" },
            { name: "Salary Recap per Department", description: "Total cost per department", type: "Excel" },
            { name: "Journal Entry", description: "Payroll accounting posting", type: "CSV" },
            { name: "Bank File Export", description: "Salary bank transfer file", type: "TXT / CSV" },
        ],
        accent: "warning",
    },
    {
        title: "Tax & BPJS Reports",
        icon: <FileText className="h-6 w-6" />,
        reports: [
            { name: "Monthly PPh 21 Return", description: "For monthly tax reporting", type: "CSV / XML" },
            { name: "Form 1721-A1", description: "Annual withholding tax slip per employee", type: "PDF" },
            { name: "Health BPJS Report", description: "Monthly Health BPJS contribution", type: "Excel" },
            { name: "Employment BPJS Report (SIPP)", description: "SIPP format for upload", type: "CSV" },
        ],
        accent: "accent",
    },
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
                        Generate and download various HR reports
                    </p>
                </div>
                <Button>
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
                                    <div key={report.name} className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/50 transition-colors group cursor-pointer">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-foreground">{report.name}</p>
                                            <p className="text-xs text-muted-foreground">{report.description}</p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <Badge variant="outline" className="text-[10px]">{report.type}</Badge>
                                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Download className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
