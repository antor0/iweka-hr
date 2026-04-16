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
    Info,
    CheckCircle
} from "lucide-react";
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
    const fmtFullDate = (d: Date) => d.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" });
    const fmtTime = (d: Date) => d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

    const canClockIn = !today || !today.clockIn;
    const canClockOut = today && today.clockIn && !today.clockOut;
    const isDone = today && today.clockIn && today.clockOut;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
                <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">Loading attendance...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-transparent font-sans relative">
            <OfflineBanner />

            <div className="relative z-10 px-4 pt-6 pb-24 max-w-[480px] mx-auto flex flex-col gap-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-foreground tracking-tight underline decoration-primary/30 underline-offset-8">Attendance</h1>
                    <p className="text-[10px] text-muted-foreground font-black mt-4 uppercase tracking-[0.2em] px-1 opacity-70">{fmtFullDate(currentTime)}</p>
                </div>

                {/* Main Clock Card */}
                <div className="glass border-border/50 rounded-[32px] p-8 flex flex-col items-center gap-6 shadow-2xl shadow-indigo-500/5 relative overflow-hidden group">
                    <div className="absolute -bottom-10 -left-10 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-1000">
                        <CalendarDays size={200} />
                    </div>

                    <div className="text-[52px] font-black tracking-tighter text-foreground font-mono leading-none">
                        {fmtTime(currentTime)}
                    </div>

                    {today && (
                        <div className="flex gap-2.5 items-center">
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
                                (statusColors[today.status] || statusColors.ABSENT).bg
                            } ${
                                (statusColors[today.status] || statusColors.ABSENT).text
                            }`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${(statusColors[today.status] || statusColors.ABSENT).dot}`} />
                                {(statusColors[today.status] || statusColors.ABSENT).label}
                            </span>
                            {today.workHours && (
                                <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 flex items-center gap-1.5">
                                    <Clock size={12} strokeWidth={2.5} /> {Number(today.workHours).toFixed(1)} hrs
                                </span>
                            )}
                        </div>
                    )}

                    <div className="flex items-center gap-4 w-full">
                        <div className="flex-1 bg-muted/30 backdrop-blur-sm rounded-2xl p-4 text-center border border-border/50 group transition-all">
                            <p className="text-[9px] text-muted-foreground uppercase font-black tracking-[0.2em] mb-2 opacity-50">Clock-In</p>
                            <p className="text-2xl font-black text-foreground font-mono">{today?.clockIn ? fmt(today.clockIn) : "--:--"}</p>
                        </div>
                        <div className="text-muted-foreground/30">
                            <MoveRight size={20} strokeWidth={3} />
                        </div>
                        <div className="flex-1 bg-muted/30 backdrop-blur-sm rounded-2xl p-4 text-center border border-border/50 group transition-all">
                            <p className="text-[9px] text-muted-foreground uppercase font-black tracking-[0.2em] mb-2 opacity-50">Clock-Out</p>
                            <p className="text-2xl font-black text-foreground font-mono">{today?.clockOut ? fmt(today.clockOut) : "--:--"}</p>
                        </div>
                    </div>

                    {message && (
                        <div className={`w-full rounded-2xl p-4 text-[11px] font-black uppercase tracking-widest border flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300 ${
                            message.type === "success" 
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" 
                                : "bg-red-500/10 border-red-500/30 text-red-500"
                        }`}>
                            {message.type === "success" ? <CheckCircle size={14} strokeWidth={3} /> : <AlertCircle size={14} strokeWidth={3} />}
                            {message.text}
                        </div>
                    )}

                    {/* Clock Action Button */}
                    {isDone ? (
                        <div className="flex flex-col items-center gap-3 py-2 group">
                            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 shadow-inner group-hover:scale-110 transition-transform duration-500 drop-shadow-sm">
                                <Sparkles size={32} strokeWidth={1.5} />
                            </div>
                            <div className="text-center">
                                <p className="text-emerald-500 font-black text-sm uppercase tracking-widest">Attendance complete</p>
                                <p className="text-[10px] text-muted-foreground font-bold mt-1 opacity-70">Great job! See you tomorrow.</p>
                            </div>
                        </div>
                    ) : (
                        <button
                            id={canClockIn ? "clock-in-btn" : "clock-out-btn"}
                            onClick={() => handleClock(canClockIn ? "clock-in" : "clock-out")}
                            disabled={isActing}
                            className={`w-full py-5 rounded-[24px] text-white text-base font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all duration-300 shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 ${
                                canClockIn
                                    ? "bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-500/30 hover:shadow-emerald-500/40"
                                    : "bg-gradient-to-br from-red-500 to-red-600 shadow-red-500/30 hover:shadow-red-500/40"
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

                    <div className="flex items-center gap-1.5 opacity-30 mt-2">
                        <Smartphone size={10} />
                        <span className="text-[9px] font-black uppercase tracking-widest">Source: Mobile ESS</span>
                    </div>
                </div>

                {/* History */}
                {history.length > 0 && (
                    <div className="flex flex-col gap-4">
                        <h2 className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.25em] px-2 opacity-60">Past 7 Days</h2>
                        <div className="flex flex-col gap-3">
                            {history.map((rec) => {
                                const sc = statusColors[rec.status] || statusColors.ABSENT;
                                return (
                                    <div key={rec.id} className="glass border-border/40 rounded-2xl p-4 flex items-center gap-4 group transition-all hover:translate-x-1 active:scale-[0.99] hover:bg-muted/30">
                                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${sc.bg}`}>
                                            <div className={`w-2.5 h-2.5 rounded-full shadow-lg ${sc.dot}`} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[13px] font-bold text-foreground">{fmtDate(rec.date)}</p>
                                            <p className="text-[11px] text-muted-foreground font-medium font-mono opacity-80">
                                                {rec.clockIn ? fmt(rec.clockIn) : "--:--"} · {rec.clockOut ? fmt(rec.clockOut) : "--:--"}
                                            </p>
                                        </div>
                                        <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${sc.bg} ${sc.text}`}>
                                            {sc.label}
                                        </div>
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

