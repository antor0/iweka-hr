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
    CalendarCheck,
    AlertCircle,
    Info,
    CalendarPlus,
    ChevronRight,
    Umbrella
} from "lucide-react";
import { MobileHeader } from "../components/mobile-header";
import { OfflineBanner } from "../components/offline-banner";
import { EssNav } from "../components/ess-nav";

interface LeaveType { id: string; name: string; code: string; isPaid: boolean; }
interface LeaveBalance { leaveTypeId: string; entitlement: number; used: number; carryOver: number; leaveType: { name: string; code: string; isPaid: boolean }; }
interface LeaveRequest { id: string; startDate: string; endDate: string; totalDays: number; reason: string; status: string; leaveType: { name: string }; }

const statusStyle: Record<string, { bg: string; text: string; label: string; icon: any }> = {
    PENDING: { bg: "bg-amber-500/10", text: "text-amber-500", label: "Pending", icon: Clock },
    APPROVED: { bg: "bg-emerald-500/10", text: "text-emerald-500", label: "Approved", icon: CheckCircle2 },
    REJECTED: { bg: "bg-red-500/10", text: "text-red-500", label: "Rejected", icon: XCircle },
    CANCELLED: { bg: "bg-muted/10", text: "text-muted-foreground", label: "Cancelled", icon: Info },
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

    const fmtDate = (d: string) => new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[var(--ios-system-bg)] flex flex-col items-center justify-center">
                <div className="w-8 h-8 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--ios-system-bg)] pb-24 font-sans">
            <OfflineBanner />
            <MobileHeader 
                title="Leave" 
                rightAction={
                    <button 
                        onClick={() => { setShowForm(!showForm); setMessage(null); }} 
                        className={`p-2 transition-all ${showForm ? "text-[var(--ios-secondary-label)]" : "text-primary active:opacity-50"}`}
                    >
                        {showForm ? <X size={24} strokeWidth={2.5} /> : <Plus size={24} strokeWidth={2.5} />}
                    </button>
                }
            />

            <div className="max-w-[480px] mx-auto pt-2 flex flex-col gap-6">
                {message && (
                    <div className="px-4">
                        <div className={`rounded-2xl p-4 text-[13px] font-bold border flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300 ${
                            message.type === "success" 
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" 
                                : "bg-red-500/10 border-red-500/30 text-red-500"
                        }`}>
                            {message.type === "success" ? <CheckCircle2 size={16} strokeWidth={3} /> : <AlertCircle size={16} strokeWidth={3} />}
                            {message.text}
                        </div>
                    </div>
                )}

                {/* Submit Form */}
                {showForm && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="ios-list-group">
                            <h2 className="ios-list-header flex items-center gap-2 px-1">
                                <CalendarPlus size={14} /> Application Details
                            </h2>
                            <form onSubmit={handleSubmit} className="flex flex-col">
                                <div className="ios-list-content">
                                    <div className="ios-cell flex flex-col items-stretch gap-1 py-1 px-4">
                                        <label className="text-[12px] font-bold text-primary uppercase tracking-tight">Leave Type</label>
                                        <select 
                                            id="leave-type-select" 
                                            value={form.leaveTypeId} 
                                            onChange={e => setForm(f => ({ ...f, leaveTypeId: e.target.value }))} 
                                            className="w-full bg-transparent text-[17px] font-normal text-[var(--ios-label)] focus:outline-none appearance-none cursor-pointer py-1" 
                                            required
                                        >
                                            <option value="">Select type...</option>
                                            {leaveTypes.map(lt => (
                                                <option key={lt.id} value={lt.id}>{lt.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="ios-cell py-1 px-4">
                                        <div className="flex-1 flex flex-col gap-1">
                                            <label className="text-[12px] font-bold text-primary uppercase tracking-tight">Start Date</label>
                                            <input 
                                                id="leave-start-date" 
                                                type="date" 
                                                value={form.startDate} 
                                                onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} 
                                                className="w-full bg-transparent text-[17px] font-normal text-[var(--ios-label)] focus:outline-none" 
                                                required 
                                            />
                                        </div>
                                        <div className="w-[0.5px] h-10 bg-[var(--ios-separator)] mx-4" />
                                        <div className="flex-1 flex flex-col gap-1 text-right">
                                            <label className="text-[12px] font-bold text-primary uppercase tracking-tight">End Date</label>
                                            <input 
                                                id="leave-end-date" 
                                                type="date" 
                                                value={form.endDate} 
                                                min={form.startDate} 
                                                onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} 
                                                className="w-full bg-transparent text-[17px] font-normal text-[var(--ios-label)] focus:outline-none text-right" 
                                                required 
                                            />
                                        </div>
                                    </div>
                                    <div className="ios-cell justify-between items-center py-3 bg-[var(--ios-system-bg)]/30">
                                        <div className="flex items-center gap-2">
                                            <CalendarCheck size={18} className="text-primary" />
                                            <span className="text-[17px] font-semibold text-primary">Total Duration</span>
                                        </div>
                                        <span className="text-[17px] font-bold text-primary">{form.totalDays} Business Days</span>
                                    </div>
                                    <div className="ios-cell flex flex-col items-stretch gap-1 py-3 px-4">
                                        <label className="text-[12px] font-bold text-primary uppercase tracking-tight">Reason</label>
                                        <textarea 
                                            id="leave-reason" 
                                            value={form.reason} 
                                            onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} 
                                            className="w-full bg-transparent text-[17px] font-normal text-[var(--ios-label)] focus:outline-none resize-none min-h-[80px]" 
                                            placeholder="Specify reason..." 
                                            required 
                                        />
                                    </div>
                                </div>
                                <div className="px-5 mt-6">
                                    <button 
                                        id="submit-leave-btn" 
                                        type="submit" 
                                        disabled={isSubmitting} 
                                        className="w-full py-4.5 bg-primary text-primary-foreground rounded-2xl text-[17px] font-bold shadow-lg shadow-primary/20 active:opacity-80 transition-all disabled:opacity-50"
                                    >
                                        {isSubmitting ? (
                                            <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                                        ) : "Submit Request"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Leave Balances Grid */}
                {!showForm && balances.length > 0 && (
                    <div className="px-4">
                        <div className="grid grid-cols-2 gap-4">
                            {balances.map((b) => {
                                const remaining = Number(b.entitlement) + Number(b.carryOver) - Number(b.used);
                                const total = Number(b.entitlement) + Number(b.carryOver);
                                return (
                                    <div key={b.leaveTypeId} className="bg-[var(--ios-secondary-bg)] rounded-2xl p-4 shadow-sm border border-[var(--ios-separator)] flex flex-col gap-1 relative overflow-hidden group">
                                        <div className="absolute right-0 top-0 opacity-[0.05] p-2 rotate-12">
                                            <Umbrella size={48} />
                                        </div>
                                        <p className="text-[11px] font-bold text-[var(--ios-secondary-label)] uppercase tracking-tight">{b.leaveType.name}</p>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-[34px] font-bold text-[var(--ios-label)] tracking-tight">{remaining}</span>
                                            <span className="text-[15px] font-medium text-[var(--ios-secondary-label)]">Days</span>
                                        </div>
                                        <p className="text-[11px] font-medium text-[var(--ios-secondary-label)] mt-2">Available for {new Date().getFullYear()}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Request History */}
                <div className="ios-list-group">
                    <h2 className="ios-list-header">History</h2>
                    <div className="ios-list-content">
                        {requests.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 opacity-30">
                                <Inbox size={64} strokeWidth={1} />
                                <p className="text-[17px] font-medium mt-4">No recent history</p>
                            </div>
                        ) : (
                            requests.map((req) => {
                                const style = statusStyle[req.status] || statusStyle.CANCELLED;
                                const StatusIcon = style.icon;
                                return (
                                    <div key={req.id} className="ios-cell">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${style.bg} ${style.text}`}>
                                            <Calendar size={20} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="text-[17px] font-bold text-[var(--ios-label)] truncate">{req.leaveType.name}</p>
                                                <span className={`px-2 py-0.5 rounded-lg text-[11px] font-bold flex items-center gap-1 ${style.text} ${style.bg}`}>
                                                    <StatusIcon size={12} strokeWidth={3} />
                                                    {style.label}
                                                </span>
                                            </div>
                                            <p className="text-[13px] text-[var(--ios-secondary-label)] font-medium mt-0.5">
                                                {fmtDate(req.startDate)} — {fmtDate(req.endDate)}
                                            </p>
                                            <p className="text-[11px] text-primary font-bold mt-1 uppercase tracking-tight">{req.totalDays} Business Days</p>
                                            {req.reason && (
                                                <p className="text-[13px] text-[var(--ios-secondary-label)] italic mt-2 line-clamp-1 border-l-2 border-[var(--ios-separator)] pl-3">
                                                    "{req.reason}"
                                                </p>
                                            )}
                                        </div>
                                        <ChevronRight className="ios-chevron" size={18} />
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            <EssNav />
        </div>
    );
}
