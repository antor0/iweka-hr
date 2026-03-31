"use client";

import { GlassStatCard } from "@/components/liquid-glass/glass-stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import {
    Users,
    Clock,
    CalendarDays,
    Wallet,
    TrendingUp,
    UserPlus,
    UserMinus,
    AlertCircle,
    ArrowRight,
    CheckCircle2,
    XCircle,
    Timer,
} from "lucide-react";
import { formatIDR } from "@/lib/utils";

import { useEffect, useState } from "react";
import { format } from "date-fns";

const quickActions = [
    { label: "Add Employee", icon: <UserPlus className="h-4 w-4" />, href: "/employees/new" },
    { label: "Run Payroll", icon: <Wallet className="h-4 w-4" />, href: "/payroll" },
    { label: "View Attendance", icon: <Clock className="h-4 w-4" />, href: "/attendance" },
    { label: "Reports", icon: <TrendingUp className="h-4 w-4" />, href: "/reports" },
];

const statIcons: Record<string, React.ReactNode> = {
    "Total Employees": <Users className="h-5 w-5" />,
    "Present Today": <Clock className="h-5 w-5" />,
    "Leave Requests": <CalendarDays className="h-5 w-5" />,
    "Total Payroll This Month": <Wallet className="h-5 w-5" />,
};

const activityIcons: Record<string, React.ReactNode> = {
    "join": <UserPlus className="h-4 w-4 text-success" />,
    "leave": <CalendarDays className="h-4 w-4 text-warning" />,
    "payroll": <Wallet className="h-4 w-4 text-success" />,
    "resign": <UserMinus className="h-4 w-4 text-destructive" />,
    "alert": <AlertCircle className="h-4 w-4 text-warning" />,
};

export default function DashboardPage() {
    const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
        fetchPendingApprovals();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const res = await fetch("/api/v1/dashboard");
            const data = await res.json();
            if (data?.success) {
                setDashboardData(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch dashboard data", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchPendingApprovals = async () => {
        try {
            const res = await fetch("/api/v1/leave?status=PENDING&limit=5");
            const data = await res.json();
            if (data?.data) {
                setPendingApprovals(data.data.map((req: any) => ({
                    id: req.id,
                    employee: req.employee?.fullName || "Unknown",
                    initials: req.employee?.fullName?.substring(0, 2).toUpperCase() || "??",
                    type: req.leaveType?.name || "Leave",
                    date: `${format(new Date(req.startDate), "dd MMM")} - ${format(new Date(req.endDate), "dd MMM yyyy")}`,
                    status: "pending"
                })));
            }
        } catch (error) {
            console.error("Failed to fetch pending approvals", error);
        }
    };

    const handleApprovalAction = async (id: string, action: "APPROVED" | "REJECTED") => {
        try {
            const res = await fetch(`/api/v1/leave/requests/${id}/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: action }),
            });

            if (!res.ok) throw new Error("Failed to update status");

            fetchPendingApprovals(); // Refresh list
        } catch (error: any) {
            console.error(error);
        }
    };

    if (isLoading || !dashboardData) {
        return <div className="p-8 flex items-center justify-center animate-pulse"><Clock className="h-6 w-6 text-muted-foreground mr-2" /> Loading dashboard...</div>;
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Page header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">
                        Welcome back, andiko 👋
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Here is your HRIS summary for today — {format(new Date(), "EEEE, dd MMMM yyyy")}
                    </p>
                </div>
                <div className="flex gap-2">
                    {quickActions.map((action) => (
                        <Button key={action.label} variant="glass" size="sm" className="gap-1.5" asChild>
                            <Link href={action.href}>
                                {action.icon}
                                <span className="hidden md:inline">{action.label}</span>
                            </Link>
                        </Button>
                    ))}
                </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {dashboardData.stats.map((stat: any) => (
                    <GlassStatCard
                        key={stat.title}
                        title={stat.title}
                        value={stat.value}
                        subtitle={stat.subtitle}
                        icon={statIcons[stat.title] || <Users className="h-5 w-5" />}
                        trend={stat.trend}
                        accentColor={stat.accent}
                    />
                ))}
            </div>

            {/* Main content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Pending Approvals */}
                <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Timer className="h-5 w-5 text-primary" />
                            Pending Approvals
                        </CardTitle>
                        <Badge variant="warning">{pendingApprovals.length} pending</Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {pendingApprovals.map((item, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors group"
                                >
                                    <Avatar className="h-9 w-9">
                                        <AvatarFallback className="text-xs">
                                            {item.initials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate">
                                            {item.employee}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {item.type} • {item.date}
                                        </p>
                                    </div>
                                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-7 w-7 p-0 text-success hover:text-success hover:bg-success/10 rounded-lg"
                                            onClick={() => handleApprovalAction(item.id, "APPROVED")}
                                        >
                                            <CheckCircle2 className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg"
                                            onClick={() => handleApprovalAction(item.id, "REJECTED")}
                                        >
                                            <XCircle className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Button variant="ghost" className="w-full mt-3 text-primary hover:text-primary" asChild>
                            <Link href="/leave">
                                View All Approvals <ArrowRight className="h-4 w-4 ml-1" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                {/* Department Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-accent" />
                            Department Distribution
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {dashboardData.departmentData.map((dept: any) => (
                                <div key={dept.name} className="space-y-1.5">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-foreground font-medium">
                                            {dept.name}
                                        </span>
                                        <span className="text-muted-foreground text-xs">
                                            {dept.count} members
                                        </span>
                                    </div>
                                    <Progress value={dept.percentage} />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Activity Feed */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        Recent Activities
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="text-primary" asChild>
                        <Link href="/reports">
                            View All
                        </Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="space-y-1">
                        {dashboardData.recentActivities.map((activity: any, i: number) => (
                            <div
                                key={i}
                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors"
                            >
                                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-secondary/50">
                                    {activityIcons[activity.type] || <CheckCircle2 className="h-4 w-4 text-primary" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-foreground">
                                        <span className="font-medium">{activity.name}</span>{" "}
                                        {activity.action}
                                    </p>
                                </div>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                    {format(new Date(activity.time), "MMM d, h:mm a")}
                                </span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
