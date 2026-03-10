"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlassStatCard } from "@/components/liquid-glass/glass-stat-card";
import {
    CalendarDays,
    Plus,
    CheckCircle2,
    XCircle,
    Clock,
    TreePalm,
    Pill,
    Heart,
} from "lucide-react";

const leaveStats = [
    { title: "Total Leave Used", value: "1,248", subtitle: "Year 2026", icon: <CalendarDays className="h-5 w-5" />, accent: "primary" as const },
    { title: "Pending Approval", value: "7", subtitle: "Needs action", icon: <Clock className="h-5 w-5" />, accent: "warning" as const },
    { title: "Approved This Month", value: "42", subtitle: "February 2026", icon: <CheckCircle2 className="h-5 w-5" />, accent: "success" as const },
    { title: "Rejected This Month", value: "3", subtitle: "February 2026", icon: <XCircle className="h-5 w-5" />, accent: "destructive" as const },
];

const leaveRequests = [
    { id: 1, name: "Dewi Sari", initials: "DS", type: "Annual Leave", icon: <TreePalm className="h-4 w-4" />, start: "25/02/2026", end: "27/02/2026", days: 3, reason: "Family event", status: "pending" },
    { id: 2, name: "Hendra Wijaya", initials: "HW", type: "Sick Leave", icon: <Pill className="h-4 w-4" />, start: "23/02/2026", end: "23/02/2026", days: 1, reason: "Fever", status: "pending" },
    { id: 3, name: "Agus Prasetyo", initials: "AP", type: "Annual Leave", icon: <TreePalm className="h-4 w-4" />, start: "28/02/2026", end: "01/03/2026", days: 2, reason: "Holiday", status: "pending" },
    { id: 4, name: "Siti Nurhaliza", initials: "SN", type: "Marriage Leave", icon: <Heart className="h-4 w-4" />, start: "10/03/2026", end: "12/03/2026", days: 3, reason: "Wedding", status: "approved" },
    { id: 5, name: "Rina Kartika", initials: "RK", type: "Annual Leave", icon: <TreePalm className="h-4 w-4" />, start: "15/02/2026", end: "15/02/2026", days: 1, reason: "Personal matters", status: "approved" },
    { id: 6, name: "Reza Mahendra", initials: "RM", type: "Sick Leave", icon: <Pill className="h-4 w-4" />, start: "14/02/2026", end: "14/02/2026", days: 1, reason: "Stomachache", status: "rejected" },
];

const statusMap: Record<string, { label: string; variant: "warning" | "success" | "destructive" }> = {
    pending: { label: "Pending", variant: "warning" },
    approved: { label: "Approved", variant: "success" },
    rejected: { label: "Rejected", variant: "destructive" },
};

export default function LeavePage() {
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
                        <CalendarDays className="h-6 w-6 text-primary" />
                        Leave Management
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage employee leave requests and balances
                    </p>
                </div>
                <Button size="sm">
                    <Plus className="h-4 w-4 mr-1.5" /> Submit Leave
                </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {leaveStats.map((stat) => (
                    <GlassStatCard key={stat.title} title={stat.title} value={stat.value} subtitle={stat.subtitle} icon={stat.icon} accentColor={stat.accent} />
                ))}
            </div>

            <Tabs defaultValue="all">
                <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="pending">Pending (3)</TabsTrigger>
                    <TabsTrigger value="approved">Approved</TabsTrigger>
                    <TabsTrigger value="rejected">Rejected</TabsTrigger>
                </TabsList>

                <TabsContent value="all">
                    <Card>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-border">
                                            <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Employee</th>
                                            <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Leave Type</th>
                                            <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Date</th>
                                            <th className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Days</th>
                                            <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Reason</th>
                                            <th className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Status</th>
                                            <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {leaveRequests.map((req) => (
                                            <tr key={req.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors group">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarFallback className="text-xs">{req.initials}</AvatarFallback>
                                                        </Avatar>
                                                        <span className="text-sm font-medium">{req.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-1.5 text-sm">
                                                        {req.icon}
                                                        {req.type}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-muted-foreground">
                                                    {req.start === req.end ? req.start : `${req.start} - ${req.end}`}
                                                </td>
                                                <td className="px-4 py-3 text-center text-sm font-medium">{req.days}</td>
                                                <td className="px-4 py-3 text-sm text-muted-foreground">{req.reason}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <Badge variant={statusMap[req.status].variant}>
                                                        {statusMap[req.status].label}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    {req.status === "pending" && (
                                                        <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button size="sm" variant="ghost" className="h-7 px-2 text-success hover:bg-success/10">
                                                                <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve
                                                            </Button>
                                                            <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive hover:bg-destructive/10">
                                                                <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                                                            </Button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
