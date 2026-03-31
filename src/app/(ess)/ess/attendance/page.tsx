"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { OfflineBanner } from "../components/offline-banner";
import { EssNav } from "../components/ess-nav";

interface AttendanceRecord {
    id: string;
    date: string;
    clockIn?: string;
    clockOut?: string;
    status: string;
    workHours?: number;
    source: string;
}

const statusColors: Record<string, { bg: string; color: string; label: string }> = {
    PRESENT: { bg: "rgba(16,185,129,0.15)", color: "#34d399", label: "Present" },
    LATE: { bg: "rgba(245,158,11,0.15)", color: "#fbbf24", label: "Late" },
    ABSENT: { bg: "rgba(239,68,68,0.15)", color: "#f87171", label: "Absent" },
    LEAVE: { bg: "rgba(99,102,241,0.15)", color: "#818cf8", label: "Leave" },
    HOLIDAY: { bg: "rgba(168,85,247,0.15)", color: "#c084fc", label: "Holiday" },
};

export default function EssAttendancePage() {
    const router = useRouter();
    const [today, setToday] = useState<AttendanceRecord | null>(null);
    const [history, setHistory] = useState<AttendanceRecord[]>([]);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isLoading, setIsLoading] = useState(true);
    const [isActing, setIsActing] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchData = useCallback(async () => {
        try {
            const res = await fetch("/api/v1/ess/attendance");
            if (res.status === 401) { router.push("/ess"); return; }
            if (res.ok) {
                const data = await res.json();
                setToday(data.data?.today || null);
                setHistory(data.data?.history || []);
            }
        } catch { } finally { setIsLoading(false); }
    }, [router]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleClock = async (action: "clock-in" | "clock-out") => {
        setIsActing(true);
        setMessage(null);
        try {
            const res = await fetch("/api/v1/ess/attendance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action }),
            });
            const data = await res.json();
            if (res.ok) {
                setMessage({ type: "success", text: action === "clock-in" ? "✅ Clock In successful!" : "✅ Clock Out successful!" });
                await fetchData();
            } else {
                setMessage({ type: "error", text: data.error || "Attendance failed" });
            }
        } catch {
            setMessage({ type: "error", text: "Could not connect to the server" });
        } finally { setIsActing(false); }
    };

    const fmt = (d: string) => new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" });
    const fmtFullDate = (d: Date) => d.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" });
    const fmtTime = (d: Date) => d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

    const canClockIn = !today || !today.clockIn;
    const canClockOut = today && today.clockIn && !today.clockOut;
    const isDone = today && today.clockIn && today.clockOut;

    if (isLoading) {
        return (
            <div style={s.root}>
                <div style={s.loadingCenter}>
                    <div style={s.spinner} />
                </div>
            </div>
        );
    }

    return (
        <div style={s.root}>
            <OfflineBanner />
            <div style={s.orb} />

            <div style={s.page}>
                <h1 style={s.pageTitle}>Attendance</h1>
                <p style={s.pageDate}>{fmtFullDate(currentTime)}</p>

                {/* Main Clock Card */}
                <div style={s.mainCard}>
                    <div style={s.liveTime}>{fmtTime(currentTime)}</div>

                    {today && (
                        <div style={s.statusRow}>
                            <span style={{ ...s.chip, background: (statusColors[today.status] || statusColors.ABSENT).bg, color: (statusColors[today.status] || statusColors.ABSENT).color }}>
                                {(statusColors[today.status] || statusColors.ABSENT).label}
                            </span>
                            {today.workHours && (
                                <span style={s.workHoursChip}>
                                    ⏱ {Number(today.workHours).toFixed(1)} hours
                                </span>
                            )}
                        </div>
                    )}

                    <div style={s.timePair}>
                        <div style={s.timeBox}>
                            <p style={s.timeLabel}>In</p>
                            <p style={s.timeValue}>{today?.clockIn ? fmt(today.clockIn) : "--:--"}</p>
                        </div>
                        <div style={s.timeSep}>→</div>
                        <div style={s.timeBox}>
                            <p style={s.timeLabel}>Out</p>
                            <p style={s.timeValue}>{today?.clockOut ? fmt(today.clockOut) : "--:--"}</p>
                        </div>
                    </div>

                    {message && (
                        <div style={{ ...s.msgBox, background: message.type === "success" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.12)", borderColor: message.type === "success" ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.25)", color: message.type === "success" ? "#34d399" : "#fca5a5" }}>
                            {message.text}
                        </div>
                    )}

                    {/* Clock Action Button */}
                    {isDone ? (
                        <div style={s.doneBox}>
                            <span style={{ fontSize: 32 }}>🎉</span>
                            <p style={{ margin: 0, color: "#34d399", fontWeight: 700 }}>Attendance complete for today</p>
                            <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>See you tomorrow!</p>
                        </div>
                    ) : (
                        <button
                            id={canClockIn ? "clock-in-btn" : "clock-out-btn"}
                            onClick={() => handleClock(canClockIn ? "clock-in" : "clock-out")}
                            disabled={isActing}
                            style={{
                                ...s.clockBtn,
                                background: canClockIn
                                    ? "linear-gradient(135deg, #10b981, #059669)"
                                    : "linear-gradient(135deg, #ef4444, #dc2626)",
                                boxShadow: canClockIn
                                    ? "0 4px 20px rgba(16,185,129,0.4)"
                                    : "0 4px 20px rgba(239,68,68,0.4)",
                                opacity: isActing ? 0.7 : 1,
                            }}
                        >
                            {isActing ? (
                                <span style={s.btnSpinner} />
                            ) : canClockIn ? (
                                <><span style={{ fontSize: 20 }}>🟢</span> Clock In</>
                            ) : (
                                <><span style={{ fontSize: 20 }}>🔴</span> Clock Out</>
                            )}
                        </button>
                    )}

                    <p style={s.sourceNote}>📱 Source: Mobile ESS</p>
                </div>

                {/* History */}
                {history.length > 0 && (
                    <div style={s.historySection}>
                        <h2 style={s.sectionTitle}>History for Last 7 Days</h2>
                        <div style={s.historyList}>
                            {history.map((rec) => {
                                const sc = statusColors[rec.status] || statusColors.ABSENT;
                                return (
                                    <div key={rec.id} style={s.histItem}>
                                        <div style={{ ...s.histStatus, background: sc.bg }}>
                                            <span style={{ ...s.histStatusDot, background: sc.color }} />
                                        </div>
                                        <div style={s.histInfo}>
                                            <p style={s.histDate}>{fmtDate(rec.date)}</p>
                                            <p style={s.histTimes}>
                                                {rec.clockIn ? fmt(rec.clockIn) : "--:--"} → {rec.clockOut ? fmt(rec.clockOut) : "--:--"}
                                            </p>
                                        </div>
                                        <div style={{ ...s.histChip, background: sc.bg, color: sc.color }}>
                                            {sc.label}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div style={{ height: 80 }} />
            </div>

            <EssNav />

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                button:hover:not(:disabled) { filter: brightness(1.1); }
            `}</style>
        </div>
    );
}

const s: Record<string, any> = {
    root: { minHeight: "100vh", background: "linear-gradient(135deg, #0f0f1a 0%, #1a1033 50%, #0a1628 100%)", fontFamily: "var(--font-sans, Inter, system-ui, sans-serif)", position: "relative" },
    orb: { position: "fixed", top: "-10%", right: "-5%", width: 300, height: 300, borderRadius: "50%", background: "rgba(16,185,129,0.12)", filter: "blur(80px)", pointerEvents: "none", zIndex: 0 },
    loadingCenter: { display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" },
    spinner: { width: 36, height: 36, border: "3px solid rgba(99,102,241,0.3)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
    page: { position: "relative", zIndex: 1, padding: "20px 16px 0", maxWidth: 480, margin: "0 auto" },
    pageTitle: { margin: "0 0 2px", fontSize: 26, fontWeight: 800, color: "#e0e7ff" },
    pageDate: { margin: "0 0 20px", fontSize: 13, color: "#64748b" },
    mainCard: {
        background: "rgba(255,255,255,0.04)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.08)", borderRadius: 24, padding: "24px 20px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.3)", marginBottom: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
    },
    liveTime: { fontSize: 52, fontWeight: 800, background: "linear-gradient(135deg, #a5b4fc, #67e8f9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", letterSpacing: "-2px" },
    statusRow: { display: "flex", gap: 10, alignItems: "center" },
    chip: { padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700 },
    workHoursChip: { padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: "rgba(99,102,241,0.15)", color: "#818cf8" },
    timePair: { display: "flex", alignItems: "center", gap: 12, width: "100%" },
    timeBox: { flex: 1, background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "12px", textAlign: "center" as const },
    timeLabel: { margin: "0 0 4px", fontSize: 11, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.05em" },
    timeValue: { margin: 0, fontSize: 24, fontWeight: 800, color: "#e0e7ff" },
    timeSep: { fontSize: 18, color: "#475569" },
    msgBox: { width: "100%", borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 600, border: "1px solid", textAlign: "center" as const, boxSizing: "border-box" as const },
    clockBtn: {
        width: "100%", padding: "18px", borderRadius: 16, border: "none", color: "#fff",
        fontSize: 18, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center",
        justifyContent: "center", gap: 10, transition: "all 0.2s", letterSpacing: "0.02em",
    },
    btnSpinner: { width: 20, height: 20, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" },
    doneBox: { display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "12px 0" },
    sourceNote: { margin: 0, fontSize: 11, color: "#334155" },
    historySection: { marginBottom: 24 },
    sectionTitle: { margin: "0 0 12px", fontSize: 14, fontWeight: 600, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.08em" },
    historyList: { display: "flex", flexDirection: "column", gap: 8 },
    histItem: { display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "12px 14px", border: "1px solid rgba(255,255,255,0.06)" },
    histStatus: { width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
    histStatusDot: { width: 10, height: 10, borderRadius: "50%" },
    histInfo: { flex: 1 },
    histDate: { margin: "0 0 2px", fontSize: 13, fontWeight: 600, color: "#cbd5e1" },
    histTimes: { margin: 0, fontSize: 12, color: "#475569" },
    histChip: { padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" },
};
