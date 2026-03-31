"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { OfflineBanner } from "../components/offline-banner";
import { EssNav } from "../components/ess-nav";

interface LeaveType { id: string; name: string; code: string; isPaid: boolean; }
interface LeaveBalance { leaveTypeId: string; entitlement: number; used: number; carryOver: number; leaveType: { name: string; code: string; isPaid: boolean }; }
interface LeaveRequest { id: string; startDate: string; endDate: string; totalDays: number; reason: string; status: string; leaveType: { name: string }; }

const statusStyle: Record<string, { bg: string; color: string }> = {
    PENDING: { bg: "rgba(245,158,11,0.15)", color: "#fbbf24" },
    APPROVED: { bg: "rgba(16,185,129,0.15)", color: "#34d399" },
    REJECTED: { bg: "rgba(239,68,68,0.15)", color: "#f87171" },
    CANCELLED: { bg: "rgba(100,116,139,0.15)", color: "#94a3b8" },
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

    // Auto-calculate days when dates change
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
                setMessage({ type: "success", text: "✅ Leave request submitted successfully!" });
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
        return <div style={s.root}><div style={s.center}><div style={s.spinner} /></div></div>;
    }

    return (
        <div style={s.root}>
            <OfflineBanner />
            <div style={s.orb} />

            <div style={s.page}>
                <div style={s.headerRow}>
                    <div>
                        <h1 style={s.pageTitle}>Leave</h1>
                        <p style={s.pageSub}>Manage your leave requests</p>
                    </div>
                    <button id="new-leave-btn" onClick={() => { setShowForm(!showForm); setMessage(null); }} style={s.newBtn}>
                        {showForm ? "✕ Close" : "+ Request"}
                    </button>
                </div>

                {message && (
                    <div style={{ ...s.msgBox, background: message.type === "success" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.12)", borderColor: message.type === "success" ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.25)", color: message.type === "success" ? "#34d399" : "#fca5a5" }}>
                        {message.text}
                    </div>
                )}

                {/* Submit Form */}
                {showForm && (
                    <div style={s.formCard}>
                        <h2 style={s.formTitle}>New Leave Request</h2>
                        <form onSubmit={handleSubmit} style={s.form}>
                            <div style={s.field}>
                                <label style={s.label}>Leave Type</label>
                                <select id="leave-type-select" value={form.leaveTypeId} onChange={e => setForm(f => ({ ...f, leaveTypeId: e.target.value }))} style={s.select} required>
                                    <option value="">Select leave type...</option>
                                    {leaveTypes.map(lt => (
                                        <option key={lt.id} value={lt.id}>{lt.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={s.dateRow}>
                                <div style={{ ...s.field, flex: 1 }}>
                                    <label style={s.label}>Start Date</label>
                                    <input id="leave-start-date" type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} style={s.input} required />
                                </div>
                                <div style={{ ...s.field, flex: 1 }}>
                                    <label style={s.label}>End Date</label>
                                    <input id="leave-end-date" type="date" value={form.endDate} min={form.startDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} style={s.input} required />
                                </div>
                            </div>
                            <div style={s.field}>
                                <label style={s.label}>Total Working Days</label>
                                <div style={s.daysDisplay}>{form.totalDays} working days</div>
                            </div>
                            <div style={s.field}>
                                <label style={s.label}>Reason</label>
                                <textarea id="leave-reason" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} style={{ ...s.input, minHeight: 80, resize: "vertical" }} placeholder="Explain the reason for leave..." required />
                            </div>
                            <button id="submit-leave-btn" type="submit" disabled={isSubmitting} style={{ ...s.submitBtn, opacity: isSubmitting ? 0.7 : 1 }}>
                                {isSubmitting ? <span style={s.btnSpinner} /> : "Submit Request"}
                            </button>
                        </form>
                    </div>
                )}

                {/* Leave Balances */}
                {balances.length > 0 && (
                    <div style={s.section}>
                        <h2 style={s.sectionTitle}>Leave Balance {new Date().getFullYear()}</h2>
                        <div style={s.balanceGrid}>
                            {balances.map((b) => {
                                const remaining = Number(b.entitlement) + Number(b.carryOver) - Number(b.used);
                                const pct = Math.min(100, (Number(b.used) / (Number(b.entitlement) + Number(b.carryOver))) * 100);
                                return (
                                    <div key={b.leaveTypeId} style={s.balanceCard}>
                                        <p style={s.balanceName}>{b.leaveType.name}</p>
                                        <div style={s.balanceNumbers}>
                                            <span style={s.balanceRemaining}>{remaining}</span>
                                            <span style={s.balanceOf}>/ {Number(b.entitlement) + Number(b.carryOver)}</span>
                                        </div>
                                        <div style={s.progressBg}>
                                            <div style={{ ...s.progressFill, width: `${pct}%` }} />
                                        </div>
                                        <p style={s.balanceSub}>Days remaining</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Request History */}
                <div style={s.section}>
                    <h2 style={s.sectionTitle}>Request History</h2>
                    {requests.length === 0 ? (
                        <div style={s.emptyState}>
                            <span style={{ fontSize: 40 }}>📭</span>
                            <p style={{ color: "#64748b", margin: "8px 0 0" }}>No leave requests yet</p>
                        </div>
                    ) : (
                        <div style={s.requestList}>
                            {requests.map((req) => {
                                const sc = statusStyle[req.status] || statusStyle.CANCELLED;
                                return (
                                    <div key={req.id} style={s.requestCard}>
                                        <div style={s.reqTop}>
                                            <p style={s.reqType}>{req.leaveType.name}</p>
                                            <span style={{ ...s.reqStatus, background: sc.bg, color: sc.color }}>{req.status}</span>
                                        </div>
                                        <p style={s.reqDates}>{fmtDate(req.startDate)} – {fmtDate(req.endDate)} · <strong style={{ color: "#a5b4fc" }}>{req.totalDays} days</strong></p>
                                        <p style={s.reqReason}>{req.reason}</p>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div style={{ height: 80 }} />
            </div>

            <EssNav />
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                select option { background: #1a1033; color: #e2e8f0; }
                input:focus, select:focus, textarea:focus { outline: none; border-color: #6366f1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.2) !important; }
                button:hover:not(:disabled) { filter: brightness(1.1); }
            `}</style>
        </div>
    );
}

const s: Record<string, any> = {
    root: { minHeight: "100vh", background: "linear-gradient(135deg, #0f0f1a 0%, #1a1033 50%, #0a1628 100%)", fontFamily: "var(--font-sans, Inter, system-ui, sans-serif)", position: "relative" },
    orb: { position: "fixed", top: "-10%", right: "-5%", width: 300, height: 300, borderRadius: "50%", background: "rgba(16,185,129,0.1)", filter: "blur(80px)", pointerEvents: "none", zIndex: 0 },
    center: { display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" },
    spinner: { width: 36, height: 36, border: "3px solid rgba(99,102,241,0.3)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
    page: { position: "relative", zIndex: 1, padding: "20px 16px 0", maxWidth: 480, margin: "0 auto" },
    headerRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
    pageTitle: { margin: "0 0 2px", fontSize: 26, fontWeight: 800, color: "#e0e7ff" },
    pageSub: { margin: 0, fontSize: 13, color: "#64748b" },
    newBtn: { padding: "8px 16px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", borderRadius: 10, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", boxShadow: "0 4px 12px rgba(99,102,241,0.4)", marginTop: 4 },
    msgBox: { borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 600, border: "1px solid", marginBottom: 16 },
    formCard: { background: "rgba(255,255,255,0.04)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 20, padding: "20px 16px", marginBottom: 20 },
    formTitle: { margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "#e0e7ff" },
    form: { display: "flex", flexDirection: "column", gap: 14 },
    field: { display: "flex", flexDirection: "column", gap: 6 },
    label: { fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" },
    input: { padding: "11px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#e2e8f0", fontSize: 14, width: "100%", boxSizing: "border-box" as const, fontFamily: "inherit" },
    select: { padding: "11px 12px", background: "rgba(15,15,26,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#e2e8f0", fontSize: 14, width: "100%", boxSizing: "border-box" as const, fontFamily: "inherit", cursor: "pointer" },
    dateRow: { display: "flex", gap: 10 },
    daysDisplay: { padding: "11px 12px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 10, color: "#818cf8", fontWeight: 700, fontSize: 14 },
    submitBtn: { padding: "13px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", borderRadius: 12, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(99,102,241,0.4)", minHeight: 48 },
    btnSpinner: { width: 18, height: 18, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
    section: { marginBottom: 20 },
    sectionTitle: { margin: "0 0 10px", fontSize: 13, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" },
    balanceGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
    balanceCard: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "14px" },
    balanceName: { margin: "0 0 8px", fontSize: 11, color: "#64748b", fontWeight: 600 },
    balanceNumbers: { display: "flex", alignItems: "baseline", gap: 4, marginBottom: 8 },
    balanceRemaining: { fontSize: 28, fontWeight: 800, color: "#e0e7ff" },
    balanceOf: { fontSize: 13, color: "#475569" },
    progressBg: { height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2, marginBottom: 4, overflow: "hidden" },
    progressFill: { height: "100%", background: "linear-gradient(90deg, #6366f1, #8b5cf6)", borderRadius: 2, transition: "width 0.5s ease" },
    balanceSub: { margin: 0, fontSize: 10, color: "#475569" },
    emptyState: { display: "flex", flexDirection: "column", alignItems: "center", padding: "32px", background: "rgba(255,255,255,0.03)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)" },
    requestList: { display: "flex", flexDirection: "column", gap: 8 },
    requestCard: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "14px" },
    reqTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
    reqType: { margin: 0, fontSize: 14, fontWeight: 600, color: "#e0e7ff" },
    reqStatus: { padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 },
    reqDates: { margin: "0 0 4px", fontSize: 12, color: "#64748b" },
    reqReason: { margin: 0, fontSize: 12, color: "#94a3b8", fontStyle: "italic" },
};
