"use client";

import { useState, useEffect, useCallback } from "react";
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
    Loader2
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";

type LeaveRequest = {
    id: string;
    employeeId: string;
    employee: { fullName: string; employeeNumber: string };
    leaveType: { name: string; code: string };
    startDate: string;
    endDate: string;
    totalDays: number;
    reason: string;
    status: string;
};

const statusMap: Record<string, { label: string; variant: "warning" | "success" | "destructive" }> = {
    PENDING: { label: "Pending", variant: "warning" },
    APPROVED: { label: "Approved", variant: "success" },
    REJECTED: { label: "Rejected", variant: "destructive" },
};

export default function LeavePage() {
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [session, setSession] = useState<any>(null);
    const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
    const [stats, setStats] = useState({
        totalUsed: 0,
        pending: 0,
        approved: 0,
        rejected: 0
    });

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state for auto-calculating days
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [totalDays, setTotalDays] = useState<number | "">("");

    useEffect(() => {
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            if (end >= start) {
                // Calculate difference in days (inclusive)
                const diffTime = Math.abs(end.getTime() - start.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                setTotalDays(diffDays);
            } else {
                setTotalDays("");
            }
        } else {
            setTotalDays("");
        }
    }, [startDate, endDate]);

    const fetchRequests = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/v1/leave?limit=100");
            const data = await res.json();
            if (data.data) {
                setRequests(data.data);
                
                // Simple stats calc
                const counts = data.data.reduce((acc: any, curr: any) => {
                    if (curr.status === "PENDING") acc.pending++;
                    if (curr.status === "APPROVED") {
                        acc.approved++;
                        acc.totalUsed += Number(curr.totalDays);
                    }
                    if (curr.status === "REJECTED") acc.rejected++;
                    return acc;
                }, { pending: 0, approved: 0, rejected: 0, totalUsed: 0 });
                setStats(counts);
            }
        } catch (error) {
            console.error("Failed to fetch requests:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const init = async () => {
            const [sessionRes, typesRes] = await Promise.all([
                fetch("/api/v1/auth/session"),
                fetch("/api/v1/leave/types")
            ]);
            
            const sessionData = await sessionRes.json();
            setSession(sessionData.session);

            const typesData = await typesRes.json();
            setLeaveTypes(typesData.data || []);

            await fetchRequests();
        };
        init();
    }, [fetchRequests]);

    const handleAction = async (id: string, action: "APPROVED" | "REJECTED") => {
        try {
            const res = await fetch(`/api/v1/leave/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: action })
            });

            if (res.ok) {
                await fetchRequests();
            } else {
                const err = await res.json();
                alert(err.error || "Action failed");
            }
        } catch (error) {
            console.error("Action error:", error);
        }
    };

    const handleCreateRequest = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        
        const payload = {
            leaveTypeId: formData.get("leaveTypeId"),
            startDate: formData.get("startDate"),
            endDate: formData.get("endDate"),
            totalDays: Number(formData.get("totalDays")),
            reason: formData.get("reason"),
        };

        try {
            const res = await fetch("/api/v1/leave", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setIsDialogOpen(false);
                setStartDate("");
                setEndDate("");
                setTotalDays("");
                await fetchRequests();
            } else {
                const err = await res.json();
                let errorMessage = err.error || "Failed to submit leave";
                
                // Extract detailed Zod validation errors if present
                if (err.details) {
                    const messages = [];
                    for (const [field, errorObj] of Object.entries(err.details)) {
                        if (field !== "_errors" && (errorObj as any)?._errors?.length) {
                            messages.push(`${field}: ${(errorObj as any)._errors.join(", ")}`);
                        }
                    }
                    if (messages.length > 0) {
                        errorMessage += "\n" + messages.join("\n");
                    }
                }
                
                alert(errorMessage);
            }
        } catch (error) {
            console.error("Submission error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const canApprove = session?.role === "SYSTEM_ADMIN" || session?.role === "HR_ADMIN" || session?.role === "HR_MANAGER";

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
                
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) {
                        setStartDate("");
                        setEndDate("");
                        setTotalDays("");
                    }
                }}>
                    <DialogTrigger asChild>
                        <Button size="sm">
                            <Plus className="h-4 w-4 mr-1.5" /> Submit Leave
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <form onSubmit={handleCreateRequest}>
                            <DialogHeader>
                                <DialogTitle>Submit Leave Request</DialogTitle>
                                <DialogDescription>
                                    Fill in the details for your leave application.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="leaveTypeId">Leave Type</Label>
                                    <Select name="leaveTypeId" required>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {leaveTypes.map((t) => (
                                                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="startDate">Start Date</Label>
                                        <Input 
                                            id="startDate" 
                                            name="startDate" 
                                            type="date" 
                                            required 
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="endDate">End Date</Label>
                                        <Input 
                                            id="endDate" 
                                            name="endDate" 
                                            type="date" 
                                            required 
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="totalDays">Total Days</Label>
                                    <Input 
                                        id="totalDays" 
                                        name="totalDays" 
                                        type="number" 
                                        step="0.5" 
                                        min="0.5" 
                                        required 
                                        placeholder="e.g. 1" 
                                        value={totalDays}
                                        onChange={(e) => setTotalDays(e.target.value ? Number(e.target.value) : "")}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="reason">Reason</Label>
                                    <Textarea id="reason" name="reason" placeholder="Brief reason for your leave (min. 5 chars)" minLength={5} required />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Submit Request
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <GlassStatCard title="Total Days Taken" value={stats.totalUsed.toString()} subtitle="Year 2026" icon={<CalendarDays className="h-5 w-5" />} accentColor="primary" />
                <GlassStatCard title="Pending Approval" value={stats.pending.toString()} subtitle="Needs action" icon={<Clock className="h-5 w-5" />} accentColor="warning" />
                <GlassStatCard title="Approved Requests" value={stats.approved.toString()} subtitle="All time" icon={<CheckCircle2 className="h-5 w-5" />} accentColor="success" />
                <GlassStatCard title="Rejected Requests" value={stats.rejected.toString()} subtitle="All time" icon={<XCircle className="h-5 w-5" />} accentColor="destructive" />
            </div>

            <Tabs defaultValue="all">
                <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
                    <TabsTrigger value="approved">Approved</TabsTrigger>
                    <TabsTrigger value="rejected">Rejected</TabsTrigger>
                </TabsList>

                {["all", "pending", "approved", "rejected"].map(tabValue => {
                    const filteredRequests = requests.filter(req => 
                        tabValue === "all" || req.status.toLowerCase() === tabValue
                    );

                    return (
                        <TabsContent key={tabValue} value={tabValue}>
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
                                                {isLoading ? (
                                                    <tr>
                                                        <td colSpan={7} className="text-center py-10">
                                                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                                                            <p className="text-sm text-muted-foreground mt-2">Loading data...</p>
                                                        </td>
                                                    </tr>
                                                ) : filteredRequests.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={7} className="text-center py-10">
                                                            <p className="text-sm text-muted-foreground">No leave requests found in this tab.</p>
                                                        </td>
                                                    </tr>
                                                ) : filteredRequests.map((req) => (
                                                    <tr key={req.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors group">
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-3">
                                                                <Avatar className="h-8 w-8">
                                                                    <AvatarFallback className="text-xs">{req.employee.fullName.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                                </Avatar>
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm font-medium">{req.employee.fullName}</span>
                                                                    <span className="text-xs text-muted-foreground">{req.employee.employeeNumber}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-1.5 text-sm font-medium">
                                                                {(req.leaveType.code === "LV-ANNUAL" || req.leaveType.code === "annual") && <TreePalm className="h-4 w-4 text-green-500" />}
                                                                {(req.leaveType.code === "LV-SICK" || req.leaveType.code === "sick") && <Pill className="h-4 w-4 text-red-500" />}
                                                                {(req.leaveType.code === "LV-MARRIAGE" || req.leaveType.code === "marriage") && <Heart className="h-4 w-4 text-pink-500" />}
                                                                {(req.leaveType.code === "LV-MATERNITY" || req.leaveType.code === "maternity") && <CalendarDays className="h-4 w-4 text-blue-500" />}
                                                                {!["LV-ANNUAL", "annual", "LV-SICK", "sick", "LV-MARRIAGE", "marriage", "LV-MATERNITY", "maternity"].includes(req.leaveType.code) && <Clock className="h-4 w-4 text-muted-foreground" />}
                                                                {req.leaveType.name}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-muted-foreground">
                                                            {format(new Date(req.startDate), "dd/MM/yyyy")} - {format(new Date(req.endDate), "dd/MM/yyyy")}
                                                        </td>
                                                        <td className="px-4 py-3 text-center text-sm font-medium">{req.totalDays}</td>
                                                        <td className="px-4 py-3 text-sm text-muted-foreground max-w-[200px] truncate" title={req.reason}>
                                                            {req.reason}
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <Badge variant={statusMap[req.status]?.variant || "warning"}>
                                                                {statusMap[req.status]?.label || req.status}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            {req.status === "PENDING" && canApprove && (
                                                                <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <Button 
                                                                        size="sm" 
                                                                        variant="ghost" 
                                                                        className="h-7 px-2 text-success hover:bg-success/10"
                                                                        onClick={() => handleAction(req.id, "APPROVED")}
                                                                    >
                                                                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve
                                                                    </Button>
                                                                    <Button 
                                                                        size="sm" 
                                                                        variant="ghost" 
                                                                        className="h-7 px-2 text-destructive hover:bg-destructive/10"
                                                                        onClick={() => handleAction(req.id, "REJECTED")}
                                                                    >
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
                    );
                })}
            </Tabs>
        </div>
    );
}

