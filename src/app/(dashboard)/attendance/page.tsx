"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Clock,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Timer,
    Calendar,
    TrendingUp,
    Users,
    Loader2
} from "lucide-react";
import { GlassStatCard } from "@/components/liquid-glass/glass-stat-card";

const statusConfig: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "secondary" }> = {
    ontime: { label: "On Time", variant: "success" },
    late: { label: "Late", variant: "warning" },
    absent: { label: "Absent", variant: "destructive" },
    leave: { label: "Leave", variant: "secondary" },
};

export default function AttendancePage() {
    const [stats, setStats] = useState<any>(null);
    const [recap, setRecap] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                // Testing with the seeder date to ensure data populates
                const res = await fetch('/api/v1/attendance/dashboard');
                const data = await res.json();
                if (data.stats) setStats(data.stats);
                if (data.recap) setRecap(data.recap);
            } catch (error) {
                console.error("Failed to fetch attendance dashboard", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    const attendanceStats = stats ? [
        {
            title: "Present",
            value: stats.present.toString(),
            subtitle: `${((stats.present / stats.total) * 100).toFixed(1)}% attendance`,
            icon: <CheckCircle2 className="h-5 w-5" />,
            accent: "success" as const
        },
        {
            title: "Late",
            value: stats.late.toString(),
            subtitle: `${((stats.late / stats.total) * 100).toFixed(1)}% late`,
            icon: <Timer className="h-5 w-5" />,
            accent: "warning" as const
        },
        {
            title: "Leave",
            value: stats.leave.toString(),
            subtitle: `${((stats.leave / stats.total) * 100).toFixed(1)}% on leave`,
            icon: <Calendar className="h-5 w-5" />,
            accent: "primary" as const
        },
        {
            title: "Absent",
            value: stats.absent.toString(),
            subtitle: `${((stats.absent / stats.total) * 100).toFixed(1)}% without notice`,
            icon: <XCircle className="h-5 w-5" />,
            accent: "destructive" as const
        },
    ] : [];

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
                        <Clock className="h-6 w-6 text-primary" />
                        Attendance
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Monitor employee attendance today — Tuesday, 25 February 2026
                    </p>
                </div>
                <Button size="sm">
                    <Clock className="h-4 w-4 mr-1.5" /> Clock In / Out
                </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {isLoading ? (
                    Array(4).fill(0).map((_, i) => (
                        <div key={i} className="h-[104px] rounded-xl border bg-card/50 animate-pulse" />
                    ))
                ) : (
                    attendanceStats.map((stat) => (
                        <GlassStatCard
                            key={stat.title}
                            title={stat.title}
                            value={stat.value}
                            subtitle={stat.subtitle}
                            icon={stat.icon}
                            accentColor={stat.accent}
                        />
                    ))
                )}
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Today's Attendance Recap
                    </CardTitle>
                    <Badge variant="outline">Live</Badge>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Employee</th>
                                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Department</th>
                                    <th className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Clock In</th>
                                    <th className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Clock Out</th>
                                    <th className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Working Hours</th>
                                    <th className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary/50" />
                                        </td>
                                    </tr>
                                ) : recap.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                                            No attendance records found for today.
                                        </td>
                                    </tr>
                                ) : recap.map((att, i) => (
                                    <tr key={i} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback className="text-xs">{att.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2)}</AvatarFallback>
                                                </Avatar>
                                                <span className="text-sm font-medium">{att.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">{att.department}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="font-mono text-sm">{att.clockIn}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="font-mono text-sm">{att.clockOut}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="font-mono text-sm">{att.hours}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <Badge variant={statusConfig[att.status]?.variant || "secondary"}>
                                                {statusConfig[att.status]?.label || att.status}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
