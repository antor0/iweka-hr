"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
    Calendar, 
    CreditCard, 
    CheckCircle2, 
    XCircle, 
    Clock, 
    Inbox, 
    CheckSquare,
    User,
    CalendarClock,
    Banknote,
    AlertCircle,
    Check
} from "lucide-react";
import { OfflineBanner } from "../components/offline-banner";
import { EssNav } from "../components/ess-nav";

interface LeaveRequest {
    id: string;
    employee: { fullName: string; employeeNumber: string };
    leaveType: { name: string };
    startDate: string;
    endDate: string;
    totalDays: number;
    reason: string;
}

interface ClaimRequest {
    id: string;
    claimNumber: string;
    employee: { fullName: string; employeeNumber: string };
    title: string;
    totalAmount: number;
    submittedAt: string;
    _count: { items: number };
}

export default function EssApprovalsPage() {
    const router = useRouter();
    const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
    const [claims, setClaims] = useState<ClaimRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const fetchApprovals = useCallback(async () => {
        try {
            const res = await fetch("/api/v1/ess/approvals");
            if (res.status === 401) { router.push("/ess"); return; }
            if (res.ok) {
                const data = await res.json();
                setLeaves(data.data.leaves || []);
                setClaims(data.data.claims || []);
            }
        } catch { } finally { setIsLoading(false); }
    }, [router]);

    useEffect(() => { fetchApprovals(); }, [fetchApprovals]);

    const handleAction = async (type: "LEAVE" | "CLAIM", id: string, action: "APPROVED" | "REJECTED") => {
        const reason = action === "REJECTED" ? prompt("Please enter a reason for rejection (optional):") : null;
        if (action === "REJECTED" && reason === null) return; // User cancelled prompt

        setProcessingId(id);
        setMessage(null);

        try {
            const res = await fetch("/api/v1/ess/approvals/process", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type, id, action, notes: reason }),
            });
            const data = await res.json();

            if (res.ok) {
                setMessage({ type: "success", text: `${type} has been ${action.toLowerCase()} successfully.` });
                if (type === "LEAVE") setLeaves(prev => prev.filter(x => x.id !== id));
                if (type === "CLAIM") setClaims(prev => prev.filter(x => x.id !== id));
            } else {
                setMessage({ type: "error", text: data.error || `Failed to process ${type}` });
            }
        } catch {
            setMessage({ type: "error", text: "Could not complete the action. Try again." });
        } finally {
            setProcessingId(null);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
                <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">Loading requests...</p>
            </div>
        );
    }

    const totalPending = leaves.length + claims.length;

    return (
        <div className="min-h-screen bg-transparent font-sans relative">
            <OfflineBanner />

            <div className="relative z-10 px-4 pt-6 pb-24 max-w-[480px] mx-auto flex flex-col gap-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-foreground tracking-tight underline decoration-primary/30 underline-offset-8">Approvals</h1>
                    <p className="text-[11px] text-muted-foreground font-black mt-4 uppercase tracking-[0.2em] px-1 opacity-70">
                        {totalPending} request{totalPending !== 1 ? "s" : ""} waiting for your action
                    </p>
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

                {/* Leave Requests */}
                <div className="flex flex-col gap-4">
                    <h2 className="text-[11px] font-black text-primary uppercase tracking-[0.25em] px-2 opacity-80 flex items-center gap-2">
                        <CheckSquare size={14} /> Leave Requests ({leaves.length})
                    </h2>
                    {leaves.length === 0 ? (
                        <div className="glass border-dashed border-border/50 rounded-[32px] p-12 flex flex-col items-center justify-center text-center opacity-60">
                            <CalendarClock size={40} className="text-muted-foreground opacity-30 mb-4" strokeWidth={1.5} />
                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">No pending leave requests</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {leaves.map((leave) => (
                                <div key={leave.id} className="glass border-border/50 rounded-[32px] p-6 shadow-xl shadow-primary/5 group transition-all">
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="w-11 h-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                                            <User size={20} strokeWidth={2.5} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-black text-foreground uppercase tracking-tight">{leave.employee.fullName}</p>
                                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60">{leave.employee.employeeNumber}</p>
                                        </div>
                                        <div className="px-3 py-1 bg-primary/15 text-primary rounded-xl text-[9px] font-black uppercase tracking-widest border border-primary/20">
                                            {leave.leaveType.name}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-3 mb-6 pb-6 border-b border-border/40">
                                        <div className="flex items-start gap-4">
                                            <span className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.2em] w-16 pt-0.5 opacity-60">Period</span>
                                            <span className="text-xs text-foreground font-bold font-mono">
                                                {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                                                <span className="text-primary ml-2 uppercase font-black text-[10px] tracking-tight">({leave.totalDays}d)</span>
                                            </span>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <span className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.2em] w-16 pt-0.5 opacity-60">Reason</span>
                                            <span className="text-[11px] text-muted-foreground font-medium leading-relaxed italic opacity-80">"{leave.reason}"</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button 
                                            onClick={() => handleAction("LEAVE", leave.id, "REJECTED")} 
                                            disabled={processingId === leave.id}
                                            className="flex-1 py-3 rounded-2xl border border-red-500/30 bg-red-500/5 text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-500/10 active:scale-[0.98] transition-all disabled:opacity-50"
                                        >
                                            <XCircle size={14} strokeWidth={2.5} /> Reject
                                        </button>
                                        <button 
                                            onClick={() => handleAction("LEAVE", leave.id, "APPROVED")} 
                                            disabled={processingId === leave.id}
                                            className="flex-1 py-3 rounded-2xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 hover:shadow-emerald-500/30 active:scale-[0.98] transition-all disabled:opacity-50"
                                        >
                                            {processingId === leave.id ? (
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <><CheckCircle2 size={14} strokeWidth={2.5} /> Approve</>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Claim Requests */}
                <div className="flex flex-col gap-4">
                    <h2 className="text-[11px] font-black text-amber-500 uppercase tracking-[0.25em] px-2 opacity-80 flex items-center gap-2">
                        <Banknote size={14} /> Expense Claims ({claims.length})
                    </h2>
                    {claims.length === 0 ? (
                        <div className="glass border-dashed border-border/50 rounded-[32px] p-12 flex flex-col items-center justify-center text-center opacity-60">
                            <Inbox size={40} className="text-muted-foreground opacity-30 mb-4" strokeWidth={1.5} />
                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">No pending expense claims</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {claims.map((claim) => (
                                <div key={claim.id} className="glass border-border/50 rounded-[32px] p-6 shadow-xl shadow-primary/5 group transition-all">
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                                            <User size={20} strokeWidth={2.5} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-black text-foreground uppercase tracking-tight">{claim.employee.fullName}</p>
                                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60 truncate max-w-[150px]">{claim.title}</p>
                                        </div>
                                        <div className="px-3 py-1 bg-amber-500/15 text-amber-500 rounded-xl text-[9px] font-black uppercase tracking-widest border border-amber-500/20">
                                            {claim._count.items} item{claim._count.items > 1 ? "s" : ""}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-3 mb-6 pb-6 border-b border-border/40">
                                        <div className="flex items-start gap-4">
                                            <span className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.2em] w-16 pt-0.5 opacity-60">Claim ID</span>
                                            <span className="text-xs text-foreground font-mono font-bold tracking-tight">{claim.claimNumber}</span>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <span className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.2em] w-16 pt-0.5 opacity-60">Amount</span>
                                            <span className="text-lg font-black text-amber-500 font-mono tracking-tighter">
                                                {new Intl.NumberFormat("en-US", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(Number(claim.totalAmount))}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button 
                                            onClick={() => handleAction("CLAIM", claim.id, "REJECTED")} 
                                            disabled={processingId === claim.id}
                                            className="flex-1 py-3 rounded-2xl border border-red-500/30 bg-red-500/5 text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-500/10 active:scale-[0.98] transition-all disabled:opacity-50"
                                        >
                                            <XCircle size={14} strokeWidth={2.5} /> Reject
                                        </button>
                                        <button 
                                            onClick={() => handleAction("CLAIM", claim.id, "APPROVED")} 
                                            disabled={processingId === claim.id}
                                            className="flex-1 py-3 rounded-2xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 hover:shadow-emerald-500/30 active:scale-[0.98] transition-all disabled:opacity-50"
                                        >
                                            {processingId === claim.id ? (
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <><CheckCircle2 size={14} strokeWidth={2.5} /> Approve</>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <EssNav />
        </div>
    );
}

