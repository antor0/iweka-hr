"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
    Calendar, 
    Plus, 
    X, 
    Inbox, 
    CheckCircle2, 
    XCircle, 
    Clock, 
    Sun,
    CalendarCheck,
    AlertCircle,
    Info,
    CalendarPlus
} from "lucide-react";
import { OfflineBanner } from "../components/offline-banner";
import { EssNav } from "../components/ess-nav";

interface LeaveType { id: string; name: string; code: string; isPaid: boolean; }
interface LeaveBalance { leaveTypeId: string; entitlement: number; used: number; carryOver: number; leaveType: { name: string; code: string; isPaid: boolean }; }
interface LeaveRequest { id: string; startDate: string; endDate: string; totalDays: number; reason: string; status: string; leaveType: { name: string }; }

const statusStyle: Record<string, { bg: string; text: string; label: string; icon: any }> = {
    PENDING: { bg: "bg-warning/15", text: "text-warning", label: "Pending", icon: Clock },
    APPROVED: { bg: "bg-success/15", text: "text-success", label: "Approved", icon: CheckCircle2 },
    REJECTED: { bg: "bg-destructive/15", text: "text-destructive", label: "Rejected", icon: XCircle },
    CANCELLED: { bg: "bg-muted/15", text: "text-muted-foreground", label: "Cancelled", icon: Info },
};

export default function EssLeavePage() {
    const router = useRouter();
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const [balances, setBalances] = useState<LeaveBalance[]>([]);
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const [form, setForm] = useState({
        leaveTypeId: "",
        startDate: "",
        endDate: "",
        totalDays: 1,
        reason: "",
    });

    const fetchData = useCallback(async () => {
        try {
            const [typesRes, leaveRes] = await Promise.all([
                fetch("/api/v1/ess/leave/types"),
                fetch("/api/v1/ess/leave"),
            ]);
            if (typesRes.status === 401 || leaveRes.status === 401) { router.push("/ess"); return; }
            if (typesRes.ok) setLeaveTypes((await typesRes.json()).data || []);
            if (leaveRes.ok) {
                const d = await leaveRes.json();
                setBalances(d.data?.balances || []);
                setRequests(d.data?.requests || []);
            }
        } catch { } finally { setIsLoading(false); }
    }, [router]);

    useEffect(() => { fetchData(); }, [fetchData]);

    useEffect(() => {
        if (form.startDate && form.endDate) {
            const start = new Date(form.startDate);
            const end = new Date(form.endDate);
            if (end >= start) {
                let days = 0;
                const cur = new Date(start);
                while (cur <= end) {
                    const dow = cur.getDay();
                    if (dow !== 0 && dow !== 6) days++;
                    cur.setDate(cur.getDate() + 1);
                }
                setForm(f => ({ ...f, totalDays: days || 1 }));
            }
        }
    }, [form.startDate, form.endDate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage(null);
        try {
            const res = await fetch("/api/v1/ess/leave", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (res.ok) {
                setMessage({ type: "success", text: "Leave request submitted successfully!" });
                setShowForm(false);
                setForm({ leaveTypeId: "", startDate: "", endDate: "", totalDays: 1, reason: "" });
                await fetchData();
            } else {
                setMessage({ type: "error", text: data.error || "Failed to submit leave request" });
            }
        } catch {
            setMessage({ type: "error", text: "Could not connect to the server" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
                <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">Loading leave data...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-transparent font-sans relative">
            <OfflineBanner />

            <div className="relative z-10 px-4 pt-6 pb-24 max-w-[480px] mx-auto flex flex-col gap-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-extrabold text-foreground tracking-tight underline decoration-primary/30 underline-offset-8">Leave</h1>
                        <p className="text-[11px] text-muted-foreground font-black mt-4 uppercase tracking-[0.2em] px-1 opacity-70">Manage your leave requests</p>
                    </div>
                    <button 
                        id="new-leave-btn" 
                        onClick={() => { setShowForm(!showForm); setMessage(null); }} 
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg transition-all active:scale-90 ${
                            showForm 
                                ? "bg-muted text-muted-foreground" 
                                : "bg-gradient-to-br from-primary to-indigo-600 text-white shadow-primary/30"
                        }`}
                        title={showForm ? "Close Form" : "New Request"}
                    >
                        {showForm ? <X size={20} strokeWidth={2.5} /> : <Plus size={20} strokeWidth={2.5} />}
                    </button>
                </div>

                {message && (
                    <div className={`rounded-2xl p-4 text-[11px] font-black uppercase tracking-widest border flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300 ${
                        message.type === "success" 
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" 
                            : "bg-red-500/10 border-red-500/30 text-red-500"
                    }`}>
                        {message.type === "success" ? <CheckCircle2 size={14} strokeWidth={3} /> : <AlertCircle size={14} strokeWidth={3} />}
                        {message.text}
                    </div>
                )}

                {/* Submit Form */}
                {showForm && (
                    <div className="glass border-primary/20 rounded-[32px] p-6 shadow-2xl shadow-primary/5 animate-in fade-in slide-in-from-top-4 duration-500">
                        <h2 className="text-base font-black text-foreground uppercase tracking-widest mb-6 flex items-center gap-2">
                            <CalendarPlus size={18} className="text-primary" /> New Request
                        </h2>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] pl-1">Leave Type</label>
                                <div className="relative">
                                    <select 
                                        id="leave-type-select" 
                                        value={form.leaveTypeId} 
                                        onChange={e => setForm(f => ({ ...f, leaveTypeId: e.target.value }))} 
                                        className="w-full bg-muted/30 border border-border/50 rounded-2xl px-4 py-3.5 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none cursor-pointer" 
                                        required
                                    >
                                        <option value="" className="bg-background">Select leave type...</option>
                                        {leaveTypes.map(lt => (
                                            <option key={lt.id} value={lt.id} className="bg-background">{lt.name}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                                        <Sun size={14} />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex gap-4">
                                <div className="flex-1 flex flex-col gap-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] pl-1">Start Date</label>
                                    <input 
                                        id="leave-start-date" 
                                        type="date" 
                                        value={form.startDate} 
                                        onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} 
                                        className="w-full bg-muted/30 border border-border/50 rounded-2xl px-4 py-3.5 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-sans" 
                                        required 
                                    />
                                </div>
                                <div className="flex-1 flex flex-col gap-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] pl-1">End Date</label>
                                    <input 
                                        id="leave-end-date" 
                                        type="date" 
                                        value={form.endDate} 
                                        min={form.startDate} 
                                        onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} 
                                        className="w-full bg-muted/30 border border-border/50 rounded-2xl px-4 py-3.5 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-sans" 
                                        required 
                                    />
                                </div>
                            </div>

                            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex justify-between items-center px-5">
                                <div className="flex items-center gap-2">
                                    <CalendarCheck size={16} className="text-primary" />
                                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Total Days</span>
                                </div>
                                <span className="text-sm font-black text-primary uppercase tracking-tight">{form.totalDays} working days</span>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] pl-1">Reason</label>
                                <textarea 
                                    id="leave-reason" 
                                    value={form.reason} 
                                    onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} 
                                    className="w-full bg-muted/30 border border-border/50 rounded-2xl px-4 py-3.5 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all min-h-[100px] resize-none" 
                                    placeholder="Briefly explain your leave..." 
                                    required 
                                />
                            </div>

                            <button 
                                id="submit-leave-btn" 
                                type="submit" 
                                disabled={isSubmitting} 
                                className="w-full py-4.5 bg-gradient-to-br from-primary to-indigo-600 rounded-[22px] text-white text-sm font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/30 hover:shadow-primary/40 active:scale-[0.98] transition-all disabled:opacity-50 mt-2"
                            >
                                {isSubmitting ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                                ) : "Submit Request"}
                            </button>
                        </form>
                    </div>
                )}

                {/* Leave Balances */}
                {balances.length > 0 && (
                    <div className="flex flex-col gap-4">
                        <h2 className="text-[11px] font-black text-primary uppercase tracking-[0.25em] px-2 opacity-80 flex items-center gap-2">
                            <Sun size={14} /> Leave Balance {new Date().getFullYear()}
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            {balances.map((b) => {
                                const remaining = Number(b.entitlement) + Number(b.carryOver) - Number(b.used);
                                const total = Number(b.entitlement) + Number(b.carryOver);
                                const pct = Math.min(100, (Number(b.used) / total) * 100);
                                return (
                                    <div key={b.leaveTypeId} className="glass border-border/50 rounded-[24px] p-5 flex flex-col gap-2 transition-all hover:translate-y-[-4px] shadow-lg shadow-primary/5 group">
                                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1 group-hover:text-primary transition-colors">{b.leaveType.name}</p>
                                        <div className="flex items-baseline gap-1.5">
                                            <span className="text-3xl font-black text-foreground tracking-tighter font-mono">{remaining}</span>
                                            <span className="text-[10px] text-muted-foreground font-black opacity-40">/ {total}</span>
                                        </div>
                                        <div className="h-1.5 bg-muted/50 rounded-full w-full overflow-hidden mt-1.5 ring-1 ring-border/20">
                                            <div 
                                                className="h-full bg-gradient-to-r from-primary to-indigo-500 rounded-full transition-all duration-1000" 
                                                style={{ width: `${pct}%` }} 
                                            />
                                        </div>
                                        <p className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.2em] opacity-30 mt-1">Days left</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Request History */}
                <div className="flex flex-col gap-4">
                    <h2 className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.25em] px-2 opacity-60">
                        Request History
                    </h2>
                    {requests.length === 0 ? (
                        <div className="glass border-dashed border-border/50 rounded-[32px] p-20 flex flex-col items-center justify-center text-center opacity-60">
                            <Inbox size={48} className="text-muted-foreground opacity-30 mb-4" strokeWidth={1.5} />
                            <p className="text-[11px] text-muted-foreground font-black uppercase tracking-widest opacity-60">No leave requests yet</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {requests.map((req) => {
                                const style = statusStyle[req.status] || statusStyle.CANCELLED;
                                const StatusIcon = style.icon;
                                return (
                                    <div key={req.id} className="glass border-border/40 rounded-2xl p-5 flex flex-col gap-4 group transition-all hover:bg-muted/10">
                                        <div className="flex justify-between items-center">
                                            <p className="text-sm font-black text-foreground uppercase tracking-tight">{req.leaveType.name}</p>
                                            <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ${style.bg} ${style.text}`}>
                                                <StatusIcon size={12} strokeWidth={2.5} />
                                                {style.label}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground font-bold font-mono opacity-80 mb-2">
                                                {fmtDate(req.startDate)} – {fmtDate(req.endDate)}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <Calendar size={12} className="text-primary/40" />
                                                <p className="text-[11px] text-primary font-black uppercase tracking-wider">{req.totalDays} working days</p>
                                            </div>
                                        </div>
                                        {req.reason && (
                                            <div className="bg-muted/20 rounded-xl p-3 border border-border/30">
                                                <p className="text-[11px] text-muted-foreground font-medium leading-relaxed italic opacity-80">
                                                    "{req.reason}"
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <EssNav />
        </div>
    );
}
