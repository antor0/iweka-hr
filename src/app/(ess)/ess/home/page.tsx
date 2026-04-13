"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
        { id: "qa-payslip", label: "Payslip", icon: "📄", href: "/ess/payslip", color: "rgba(99,102,241,0.2)", border: "rgba(99,102,241,0.3)" },
        { id: "qa-leave", label: "Request Leave", icon: "📅", href: "/ess/leave", color: "rgba(16,185,129,0.15)", border: "rgba(16,185,129,0.3)" },
        { id: "qa-claims", label: "Claims", icon: "💰", href: "/ess/claims", color: "rgba(245,158,11,0.15)", border: "rgba(245,158,11,0.3)" },
        { id: "qa-settings", label: "Settings", icon: "⚙️", href: "/ess/settings", color: "rgba(168,85,247,0.15)", border: "rgba(168,85,247,0.3)" },
    ];

    if (isLoading) {
        return (
            <div style={styles.root}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", flexDirection: "column", gap: 16 }}>
                    <div style={styles.spinner} />
                    <p style={{ color: "#64748b", fontSize: 14 }}>Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.root}>
            <OfflineBanner />
            <div style={styles.orb1} />
            <div style={styles.orb2} />

            <div style={styles.page}>
                {/* Header */}
                <div style={styles.header}>
                    <div>
                        <p style={styles.greeting}>{getGreeting()},</p>
                        <h1 style={styles.name}>{employee?.fullName?.split(" ")[0] || "Employee"} 👋</h1>
                        <p style={styles.role}>{employee?.position?.title || "—"} · {employee?.department?.name || "—"}</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <button 
                            onClick={() => router.push("/ess/notifications")} 
                            style={styles.bellBtn}
                        >
                            <span style={{ fontSize: 20 }}>🔔</span>
                            {unreadCount > 0 && <span style={styles.badge}>{unreadCount > 99 ? "99+" : unreadCount}</span>}
                        </button>
                        <div style={styles.avatar}>
                            {employee ? getInitials(employee.fullName) : "?"}
                        </div>
                    </div>
                </div>

                {/* Live Clock Card */}
                <div style={styles.clockCard}>
                    <div style={styles.clockTimeWrapper}>
                        <div style={styles.clockPulse} />
                        <span style={styles.clockTime}>{formatTime(currentTime)}</span>
                    </div>
                    <p style={styles.clockDate}>{formatDate(currentTime)}</p>

                    {/* Attendance Status */}
                    {todayAttendance ? (
                        <div style={styles.attendStatus}>
                            <div style={styles.attendChip(todayAttendance.status)}>
                                {todayAttendance.status === "LATE" ? "🕐 Late" :
                                 todayAttendance.status === "PRESENT" ? "✅ Present" :
                                 todayAttendance.status === "ABSENT" ? "❌ Absent" : "📋 " + todayAttendance.status}
                            </div>
                            <div style={styles.attendTimes}>
                                {todayAttendance.clockIn && (
                                    <span>In: <strong style={{ color: "#a5b4fc" }}>{new Date(todayAttendance.clockIn).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</strong></span>
                                )}
                                {todayAttendance.clockOut && (
                                    <span>Out: <strong style={{ color: "#a5b4fc" }}>{new Date(todayAttendance.clockOut).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</strong></span>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div style={styles.attendStatus}>
                            <p style={{ margin: 0, fontSize: 13, color: "#ef4444" }}>⚠ Not clocked in today</p>
                        </div>
                    )}

                    <button
                        id="home-clock-btn"
                        onClick={() => router.push("/ess/attendance")}
                        style={styles.clockBtn}
                    >
                        {!todayAttendance || !todayAttendance.clockIn
                            ? "🟢 Clock In Now"
                            : !todayAttendance.clockOut
                            ? "🔴 Clock Out"
                            : "✅ Attendance Complete"}
                    </button>
                </div>

                {/* Quick Actions */}
                <div style={styles.section}>
                    <h2 style={styles.sectionTitle}>Quick Actions</h2>
                    <div style={styles.quickGrid}>
                        {quickActions.map((qa) => (
                            <button
                                key={qa.id}
                                id={qa.id}
                                onClick={() => router.push(qa.href)}
                                style={{ ...styles.quickCard, background: qa.color, border: `1px solid ${qa.border}` }}
                            >
                                <span style={{ fontSize: 28 }}>{qa.icon}</span>
                                <span style={styles.quickLabel}>{qa.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ height: 80 }} />
            </div>

            <EssNav />

            <style>{`
                @keyframes pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.5; transform:scale(1.5); } }
                @keyframes spin { to { transform: rotate(360deg); } }
                button:hover:not(:disabled) { filter: brightness(1.1); }
            `}</style>
        </div>
    );
}

const attendChipColors: Record<string, { bg: string; color: string }> = {
    PRESENT: { bg: "rgba(16,185,129,0.15)", color: "#34d399" },
    LATE: { bg: "rgba(245,158,11,0.15)", color: "#fbbf24" },
    ABSENT: { bg: "rgba(239,68,68,0.15)", color: "#f87171" },
    LEAVE: { bg: "rgba(99,102,241,0.15)", color: "#818cf8" },
};

const styles: Record<string, any> = {
    root: {
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f0f1a 0%, #1a1033 50%, #0a1628 100%)",
        fontFamily: "var(--font-sans, Inter, system-ui, sans-serif)",
        position: "relative",
        overflow: "hidden",
    },
    orb1: { position: "fixed", top: "-10%", right: "-5%", width: 300, height: 300, borderRadius: "50%", background: "rgba(99,102,241,0.15)", filter: "blur(80px)", pointerEvents: "none", zIndex: 0 },
    orb2: { position: "fixed", bottom: "20%", left: "-10%", width: 250, height: 250, borderRadius: "50%", background: "rgba(6,182,212,0.1)", filter: "blur(80px)", pointerEvents: "none", zIndex: 0 },
    page: { position: "relative", zIndex: 1, padding: "20px 16px 0", maxWidth: 480, margin: "0 auto" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
    greeting: { margin: 0, fontSize: 13, color: "#64748b" },
    name: { margin: "2px 0 4px", fontSize: 24, fontWeight: 800, color: "#e0e7ff" },
    role: { margin: 0, fontSize: 12, color: "#475569" },
    avatar: {
        width: 48, height: 48, borderRadius: 14,
        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 16, fontWeight: 700, color: "#fff",
        boxShadow: "0 4px 12px rgba(99,102,241,0.4)",
        flexShrink: 0,
    },
    bellBtn: { 
        position: "relative", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
        width: 44, height: 44, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", padding: 0 
    },
    badge: { 
        position: "absolute", top: -4, right: -4, background: "#ef4444", color: "#fff", 
        fontSize: 10, fontWeight: 800, padding: "2px 6px", borderRadius: 10, minWidth: 16, textAlign: "center" 
    },
    clockCard: {
        background: "rgba(255,255,255,0.04)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 20,
        padding: "20px",
        marginBottom: 24,
        boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
    },
    clockTimeWrapper: { display: "flex", alignItems: "center", gap: 10, marginBottom: 4 },
    clockPulse: { width: 8, height: 8, borderRadius: "50%", background: "#10b981", animation: "pulse 2s ease-in-out infinite", flexShrink: 0 },
    clockTime: { fontSize: 42, fontWeight: 800, background: "linear-gradient(135deg, #a5b4fc, #67e8f9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", letterSpacing: "-1px", lineHeight: 1 },
    clockDate: { margin: "0 0 16px", fontSize: 13, color: "#64748b" },
    attendStatus: { marginBottom: 16, display: "flex", flexDirection: "column", gap: 6 },
    attendChip: (status: string) => ({
        display: "inline-flex", padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600,
        background: (attendChipColors[status] || attendChipColors.ABSENT).bg,
        color: (attendChipColors[status] || attendChipColors.ABSENT).color,
        alignSelf: "flex-start",
    }),
    attendTimes: { display: "flex", gap: 16, fontSize: 13, color: "#64748b" },
    clockBtn: {
        width: "100%", padding: "13px", borderRadius: 12, border: "none",
        background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff",
        fontSize: 15, fontWeight: 700, cursor: "pointer",
        boxShadow: "0 4px 20px rgba(99,102,241,0.4)",
        transition: "all 0.2s",
    },
    section: { marginBottom: 24 },
    sectionTitle: { margin: "0 0 12px", fontSize: 14, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" },
    quickGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
    quickCard: {
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8,
        padding: "20px 12px", borderRadius: 16, cursor: "pointer",
        backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
        transition: "all 0.2s", boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
    },
    quickLabel: { fontSize: 12, fontWeight: 600, color: "#cbd5e1" },
    spinner: { width: 36, height: 36, border: "3px solid rgba(99,102,241,0.3)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
};
