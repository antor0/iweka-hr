"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
    Clock, 
    LogIn, 
    LogOut, 
    CheckCircle2, 
    AlertCircle, 
    Smartphone, 
    Sparkles, 
    MoveRight,
    CalendarDays,
    CheckCircle,
    ChevronRight
} from "lucide-react";
import { MobileHeader } from "../components/mobile-header";
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

const statusColors: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    PRESENT: { bg: "bg-emerald-500/15", text: "text-emerald-500", dot: "bg-emerald-500", label: "Present" },
    LATE: { bg: "bg-amber-500/15", text: "text-amber-500", dot: "bg-amber-500", label: "Late" },
    ABSENT: { bg: "bg-red-500/15", text: "text-red-500", dot: "bg-red-500", label: "Absent" },
    LEAVE: { bg: "bg-indigo-500/15", text: "text-indigo-500", dot: "bg-indigo-500", label: "Leave" },
    HOLIDAY: { bg: "bg-purple-500/15", text: "text-purple-500", dot: "bg-purple-500", label: "Holiday" },
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
                setMessage({ type: "success", text: action === "clock-in" ? "Clock In successful!" : "Clock Out successful!" });
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
    const fmtTime = (d: Date) => d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

    const canClockIn = !today || !today.clockIn;
    const canClockOut = today && today.clockIn && !today.clockOut;
    const isDone = today && today.clockIn && today.clockOut;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[var(--ios-system-bg)] flex flex-col items-center justify-center gap-4">
                <div className="w-8 h-8 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--ios-system-bg)] pb-24">
            <OfflineBanner />
            <MobileHeader title="Attendance" />

            <div className="max-w-[480px] mx-auto px-4 pt-2 flex flex-col gap-6">
                {/* Active Session Card */}
                <div className="bg-[var(--ios-secondary-bg)] rounded-3xl p-8 flex flex-col items-center gap-6 shadow-sm border border-[var(--ios-separator)]">
                    <div className="text-[52px] font-bold tracking-tighter text-[var(--ios-label)] font-mono leading-none">
                        {fmtTime(currentTime)}
                    </div>

                    {today && (
                        <div className="flex gap-2.5 items-center">
                            <span className={`px-4 py-1.5 rounded-full text-[12px] font-bold flex items-center gap-1.5 ${
                                (statusColors[today.status] || statusColors.ABSENT).bg
                            } ${
                                (statusColors[today.status] || statusColors.ABSENT).text
                            }`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${(statusColors[today.status] || statusColors.ABSENT).dot}`} />
                                {(statusColors[today.status] || statusColors.ABSENT).label}
                            </span>
                            {today.workHours && (
                                <span className="px-4 py-1.5 rounded-full text-[12px] font-bold bg-primary/10 text-primary border border-primary/20 flex items-center gap-1.5">
                                    <Clock size={14} strokeWidth={2.5} /> {Number(today.workHours).toFixed(1)} hrs
                                </span>
                            )}
                        </div>
                    )}

                    <div className="flex items-center gap-4 w-full">
                        <div className="flex-1 bg-[var(--ios-system-bg)] rounded-2xl p-4 text-center border border-[var(--ios-separator)]">
                            <p className="text-[11px] text-[var(--ios-secondary-label)] uppercase font-bold tracking-tight mb-2">Clock-In</p>
                            <p className="text-2xl font-bold text-[var(--ios-label)] font-mono">{today?.clockIn ? fmt(today.clockIn) : "--:--"}</p>
                        </div>
                        <div className="text-muted-foreground/30">
                            <MoveRight size={20} strokeWidth={3} />
                        </div>
                        <div className="flex-1 bg-[var(--ios-system-bg)] rounded-2xl p-4 text-center border border-[var(--ios-separator)]">
                            <p className="text-[11px] text-[var(--ios-secondary-label)] uppercase font-bold tracking-tight mb-2">Clock-Out</p>
                            <p className="text-2xl font-bold text-[var(--ios-label)] font-mono">{today?.clockOut ? fmt(today.clockOut) : "--:--"}</p>
                        </div>
                    </div>

                    {message && (
                        <div className={`w-full rounded-2xl p-4 text-[13px] font-bold border flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300 ${
                            message.type === "success" 
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" 
                                : "bg-red-500/10 border-red-500/30 text-red-500"
                        }`}>
                            {message.type === "success" ? <CheckCircle size={16} strokeWidth={3} /> : <AlertCircle size={16} strokeWidth={3} />}
                            {message.text}
                        </div>
                    )}

                    {isDone ? (
                        <div className="flex flex-col items-center gap-3 py-2">
                            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500">
                                <Sparkles size={32} strokeWidth={1.5} />
                            </div>
                            <div className="text-center">
                                <p className="text-emerald-500 font-bold text-[17px]">Shift Complete</p>
                                <p className="text-[13px] text-[var(--ios-secondary-label)] font-medium mt-1">Great job! See you tomorrow.</p>
                            </div>
                        </div>
                    ) : (
                        <button
                            id={canClockIn ? "clock-in-btn" : "clock-out-btn"}
                            onClick={() => handleClock(canClockIn ? "clock-in" : "clock-out")}
                            disabled={isActing}
                            className={`w-full py-4.5 rounded-2xl text-white text-[17px] font-bold flex items-center justify-center gap-3 transition-all duration-300 shadow-lg active:opacity-80 disabled:opacity-50 ${
                                canClockIn
                                    ? "bg-[#34C759] shadow-emerald-500/20"
                                    : "bg-[#FF3B30] shadow-red-500/20"
                            }`}
                        >
                            {isActing ? (
                                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : canClockIn ? (
                                <><LogIn size={20} strokeWidth={2.5} /> Clock In</>
                            ) : (
                                <><LogOut size={20} strokeWidth={2.5} /> Clock Out</>
                            )}
                        </button>
                    )}
                </div>

                {/* History List */}
                {history.length > 0 && (
                    <div className="ios-list-group">
                        <h2 className="ios-list-header">Attendance History</h2>
                        <div className="ios-list-content">
                            {history.map((rec) => {
                                const sc = statusColors[rec.status] || statusColors.ABSENT;
                                return (
                                    <div key={rec.id} className="ios-cell">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${sc.bg}`}>
                                            <div className={`w-2 h-2 rounded-full ${sc.dot}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[17px] font-normal text-[var(--ios-label)] truncate">{fmtDate(rec.date)}</p>
                                            <p className="text-[13px] text-[var(--ios-secondary-label)] font-medium font-mono">
                                                {rec.clockIn ? fmt(rec.clockIn) : "--:--"} — {rec.clockOut ? fmt(rec.clockOut) : "--:--"}
                                            </p>
                                        </div>
                                        <div className={`px-2 py-0.5 rounded-lg text-[13px] font-semibold ${sc.text}`}>
                                            {sc.label}
                                        </div>
                                        <ChevronRight className="ios-chevron" size={18} />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            <EssNav />
        </div>
    );
}
