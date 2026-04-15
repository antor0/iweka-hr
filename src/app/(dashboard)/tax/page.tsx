"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlassStatCard } from "@/components/liquid-glass/glass-stat-card";
import { formatIDR } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
    Receipt,
    Download,
    FileText,
    Settings,
    Calculator,
    Users,
    TrendingDown,
    Calendar,
    Loader2
} from "lucide-react";

export default function TaxPage() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const { toast } = useToast();

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch("/api/v1/tax/stats");
                if (res.ok) {
                    const json = await res.json();
                    setStats(json.data);
                }
            } catch (error) {
                console.error("Failed to fetch tax stats", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const handleDownloadCSV = () => {
        if (!stats?.monthlySummary || stats.monthlySummary.length === 0) {
             toast({
                 title: "No Data",
                 description: "There is no monthly return data available to export.",
                 variant: "destructive"
             });
             return;
        }

        const headers = ["Month", "Gross Income", "Taxable Income", "Tax Amount", "Employees"];
        const rows = stats.monthlySummary.map((r: any) => [
            r.month, r.gross, r.taxable, r.tax, r.employees
        ]);

        let csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n"
            + rows.map((e: any[]) => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Monthly_Tax_Return_${new Date().getFullYear()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
             title: "Export Successful",
             description: "Monthly tax return CSV generated successfully."
        });
    };

    const handle1721Export = () => {
         toast({
             title: "Coming Soon",
             description: "1721-A1 form generation will be available in the next release."
         });
    };

    if (loading) {
         return (
             <div className="flex justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
             </div>
         );
    }

    const currentYear = new Date().getFullYear();

    const taxStats = stats ? [
        { title: "Tax This Month", value: formatIDR(stats.currentMonthTax), subtitle: `${stats.currentMonthName} ${currentYear}`, icon: <Receipt className="h-5 w-5" />, accent: "primary" as const },
        { title: "Tax YTD", value: formatIDR(stats.ytdTax), subtitle: `Jan - ${stats.currentMonthName} ${currentYear}`, icon: <TrendingDown className="h-5 w-5" />, accent: "warning" as const },
        { title: "Taxpayers", value: stats.taxpayersCount.toString(), subtitle: "Employees with Tax ID", icon: <Users className="h-5 w-5" />, accent: "accent" as const },
        { title: "Method", value: stats.method, subtitle: "Current Active Configuration", icon: <Calculator className="h-5 w-5" />, accent: "success" as const },
    ] : [];
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
                        <Receipt className="h-6 w-6 text-primary" />
                        Income Tax (PPh 21)
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Income tax calculation and reporting
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link href="/settings/tax">
                        <Button variant="outline" size="sm">
                            <Settings className="h-4 w-4 mr-1.5" /> Configuration
                        </Button>
                    </Link>
                    <Button variant="outline" size="sm" onClick={handleDownloadCSV}>
                        <Download className="h-4 w-4 mr-1.5" /> Monthly Return
                    </Button>
                    <Button size="sm" onClick={handle1721Export}>
                        <FileText className="h-4 w-4 mr-1.5" /> 1721-A1
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {taxStats.map((stat) => (
                    <GlassStatCard key={stat.title} title={stat.title} value={stat.value} subtitle={stat.subtitle} icon={stat.icon} accentColor={stat.accent} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* PTKP Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            PTKP Distribution
                        </CardTitle>
                        <CardDescription>
                            Non-taxable income per category
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {stats?.ptkpDistribution.map((cat: any) => (
                                <div key={cat.status} className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/50 transition-colors">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="font-mono text-xs">{cat.status}</Badge>
                                            <span className="text-sm text-foreground">{cat.description}</span>
                                        </div>
                                        <span className="text-xs text-muted-foreground font-mono mt-0.5 block">
                                            PTKP: {formatIDR(cat.amount)} /year
                                        </span>
                                    </div>
                                    <Badge variant="secondary" className="font-mono">{cat.count} people</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Monthly Tax Summary */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-primary" />
                            Monthly Tax Recap
                        </CardTitle>
                        <CardDescription>
                            Monthly tax summary (year 2026)
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="text-left text-xs font-medium text-muted-foreground uppercase px-4 py-3">Month</th>
                                        <th className="text-right text-xs font-medium text-muted-foreground uppercase px-4 py-3">Gross</th>
                                        <th className="text-right text-xs font-medium text-muted-foreground uppercase px-4 py-3">Tax</th>
                                        <th className="text-center text-xs font-medium text-muted-foreground uppercase px-4 py-3">Emp</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats?.monthlySummary.map((row: any) => (
                                        <tr key={row.month} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                                            <td className="px-4 py-3 text-sm font-medium">{row.month}</td>
                                            <td className="px-4 py-3 text-right text-sm font-mono">{formatIDR(row.gross)}</td>
                                            <td className="px-4 py-3 text-right text-sm font-mono text-destructive">{formatIDR(row.tax)}</td>
                                            <td className="px-4 py-3 text-center text-sm">{row.employees}</td>
                                        </tr>
                                    ))}
                                    {stats?.monthlySummary.length === 0 && (
                                         <tr>
                                            <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">
                                                No monthly tax data available yet. Run payroll to generate data.
                                            </td>
                                         </tr>
                                    )}
                                </tbody>
                                {stats?.monthlySummary.length > 0 && (
                                    <tfoot>
                                        <tr className="border-t border-border bg-secondary/30">
                                            <td className="px-4 py-3 text-sm font-bold">Total YTD</td>
                                            <td className="px-4 py-3 text-right text-sm font-mono font-bold">{formatIDR(stats?.ytdGross || 0)}</td>
                                            <td className="px-4 py-3 text-right text-sm font-mono font-bold text-destructive">{formatIDR(stats?.ytdTax || 0)}</td>
                                            <td className="px-4 py-3 text-center text-sm font-bold">{stats?.taxpayersCount || 0}</td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
