"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
    Bell, 
    Clock, 
    FileText, 
    Calendar, 
    CreditCard, 
    Settings,
    CheckCircle2,
    AlertCircle,
    XCircle,
    LogIn,
    LogOut,
    ChevronRight,
    Smartphone
} from "lucide-react";
import { OfflineBanner } from "../components/offline-banner";
import { EssNav } from "../components/ess-nav";

interface Employee {
    fullName: string;
    employeeNumber: string;
    department?: { name: string };
    position?: { title: string };
    pinMustChange: boolean;
}

interface Attendance {
    clockIn?: string;
    clockOut?: string;
    status: string;
}

export default function EssHomePage() {
    const router = useRouter();
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isLoading, setIsLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchData = useCallback(async () => {
        try {
            const [profileRes, attendRes, notifRes] = await Promise.all([
                fetch("/api/v1/ess/profile"),
                fetch("/api/v1/ess/attendance"),
                fetch("/api/v1/notifications"),
            ]);

            if (profileRes.status === 401) {
                router.push("/ess");
                return;
            }

            if (profileRes.ok) {
                const profileData = await profileRes.json();
                setEmployee(profileData.data);
                if (profileData.data?.pinMustChange) {
                    router.push("/ess/settings?first=true");
                    return;
                }
            }

            if (attendRes.ok) {
                const attendData = await attendRes.json();
                setTodayAttendance(attendData.data?.today || null);
            }

            if (notifRes.ok) {
                const notifData = await notifRes.json();
                setUnreadCount(notifData.unreadCount || 0);
            }
        } catch {
            // network error
        } finally {
            setIsLoading(false);
        }
    }, [router]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString("en-US", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    const getGreeting = () => {
        const h = currentTime.getHours();
        if (h < 11) return "Good Morning";
        if (h < 15) return "Good Afternoon";
        if (h < 18) return "Good Afternoon";
        return "Good Evening";
    };

    const getInitials = (name: string) => {
        return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
    };

    const quickActions = [
        { id: "qa-payslip", label: "Payslip", icon: <FileText size={28} />, href: "/ess/payslip", border: "border-indigo-500/30", bg: "bg-indigo-500/10", text: "text-indigo-500" },
        { id: "qa-leave", label: "Leave", icon: <Calendar size={28} />, href: "/ess/leave", border: "border-emerald-500/30", bg: "bg-emerald-500/10", text: "text-emerald-500" },
        { id: "qa-claims", label: "Claims", icon: <CreditCard size={28} />, href: "/ess/claims", border: "border-amber-500/30", bg: "bg-amber-500/10", text: "text-amber-500" },
        { id: "qa-settings", label: "Settings", icon: <Settings size={28} />, href: "/ess/settings", border: "border-purple-500/30", bg: "bg-purple-500/10", text: "text-purple-500" },
    ];

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
                <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground font-medium">Loading your dashboard...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-transparent">
            <OfflineBanner />

            <div className="relative z-10 px-4 pt-5 pb-24 max-w-[480px] mx-auto flex flex-col gap-6">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-xs text-muted-foreground font-medium">{getGreeting()},</p>
                        <h1 className="text-2xl font-extrabold text-foreground tracking-tight mt-0.5">
                            {employee?.fullName?.split(" ")[0] || "Employee"} 
                            <span className="ml-2 inline-block animate-bounce origin-bottom">👋</span>
                        </h1>
                        <p className="text-[11px] text-muted-foreground font-medium mt-1 uppercase tracking-wider">{employee?.position?.title || "—"} · {employee?.department?.name || "—"}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => router.push("/ess/notifications")} 
                            className="w-11 h-11 rounded-2xl glass border-border/50 flex items-center justify-center relative active:scale-95 transition-all hover:bg-muted/30"
                        >
                            <Bell size={20} className="text-muted-foreground" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-destructive text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-lg border-2 border-background">
                                    {unreadCount > 99 ? "99+" : unreadCount}
                                </span>
                            )}
                        </button>
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-sm font-black text-white shadow-xl shadow-primary/30">
                            {employee ? getInitials(employee.fullName) : "?"}
                        </div>
                    </div>
                </div>

                {/* Live Clock Card */}
                <div className="glass rounded-[32px] p-6 relative overflow-hidden group shadow-2xl shadow-primary/5">
                    <div className="absolute -top-6 -right-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity rotate-12 group-hover:rotate-0 duration-700">
                        <Clock size={160} strokeWidth={1} className="text-foreground" />
                    </div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse ring-4 ring-emerald-500/20" />
                            <span className="text-[44px] font-black text-foreground tracking-tighter leading-none font-mono">
                                {formatTime(currentTime)}
                            </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-black mb-6 uppercase tracking-[0.2em]">{formatDate(currentTime)}</p>

                        {/* Attendance Status */}
                        <div className="flex flex-col gap-3 mb-6">
                            {todayAttendance ? (
                                <>
                                    <div className={`self-start px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
                                        todayAttendance.status === "PRESENT" ? "bg-success/15 text-success border border-success/20" :
                                        todayAttendance.status === "LATE" ? "bg-warning/15 text-warning border border-warning/20" :
                                        "bg-destructive/15 text-destructive border border-destructive/20"
                                    }`}>
                                        {todayAttendance.status === "LATE" ? <><Clock size={12} strokeWidth={2.5} /> Late Arrival</> :
                                         todayAttendance.status === "PRESENT" ? <><CheckCircle2 size={12} strokeWidth={2.5} /> On Time</> :
                                         todayAttendance.status === "ABSENT" ? <><XCircle size={12} strokeWidth={2.5} /> Absent</> : todayAttendance.status}
                                    </div>
                                    <div className="flex gap-6 px-1">
                                        {todayAttendance.clockIn && (
                                            <div className="flex flex-col">
                                                <span className="text-[9px] text-muted-foreground uppercase font-black tracking-widest mb-1 opacity-60">Clock In</span>
                                                <span className="text-sm font-black text-foreground/80 font-mono">{new Date(todayAttendance.clockIn).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>
                                            </div>
                                        )}
                                        {todayAttendance.clockOut && (
                                            <div className="flex flex-col border-l border-border/50 pl-6">
                                                <span className="text-[9px] text-muted-foreground uppercase font-black tracking-widest mb-1 opacity-60">Clock Out</span>
                                                <span className="text-sm font-black text-foreground/80 font-mono">{new Date(todayAttendance.clockOut).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-3.5 flex items-center gap-3">
                                    <AlertCircle size={18} className="text-destructive" strokeWidth={2.5} />
                                    <span className="text-destructive font-black text-[11px] uppercase tracking-wider">Not clocked in today</span>
                                </div>
                            )}
                        </div>

                        <button
                            id="home-clock-btn"
                            onClick={() => router.push("/ess/attendance")}
                            className="w-full py-4.5 bg-gradient-to-r from-primary to-indigo-600 rounded-[22px] text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group-active:translate-y-0.5"
                        >
                            {!todayAttendance || !todayAttendance.clockIn ? (
                                <><LogIn size={18} strokeWidth={2.5} /> Clock In Now</>
                            ) : !todayAttendance.clockOut ? (
                                <><LogOut size={18} strokeWidth={2.5} /> Clock Out</>
                            ) : (
                                <><CheckCircle2 size={18} strokeWidth={2.5} /> Attendance Complete</>
                            )}
                        </button>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-col gap-4">
                    <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.25em] ml-1 opacity-60">Quick Actions</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {quickActions.map((qa) => (
                            <button
                                key={qa.id}
                                id={qa.id}
                                onClick={() => router.push(qa.href)}
                                className={`flex flex-col items-center justify-center gap-4 p-8 rounded-[32px] glass backdrop-blur-2xl border transition-all duration-300 shadow-xl hover:shadow-primary/10 active:scale-95 group ${qa.border} ${qa.bg}`}
                            >
                                <div className={`p-3 rounded-2xl transition-transform duration-500 group-hover:scale-110 ${qa.text}`}>
                                    {qa.icon}
                                </div>
                                <span className="text-[11px] font-black text-foreground/80 uppercase tracking-[0.15em]">{qa.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
                
                <div className="flex justify-center mt-2 opacity-30">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass border-border/50 text-[9px] font-black uppercase tracking-widest">
                        <Smartphone size={10} /> source: Mobile ESS
                    </div>
                </div>
            </div>

            <EssNav />
        </div>
    );
}

