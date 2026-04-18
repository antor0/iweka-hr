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
    LogOut,
    ChevronRight,
    Smartphone,
    LogIn
} from "lucide-react";
import { MobileHeader } from "../components/mobile-header";
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
        });
    };

    const quickActions = [
        { id: "qa-payslip", label: "My Payslip", icon: <FileText size={20} className="text-[#5856D6]" />, href: "/ess/payslip" },
        { id: "qa-leave", label: "Leave Requests", icon: <Calendar size={20} className="text-[#34C759]" />, href: "/ess/leave" },
        { id: "qa-claims", label: "Claims", icon: <CreditCard size={20} className="text-[#FF9500]" />, href: "/ess/claims" },
        { id: "qa-settings", label: "App Settings", icon: <Settings size={20} className="text-[#8E8E93]" />, href: "/ess/settings" },
    ];

    if (isLoading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center">
                <div className="w-8 h-8 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex-1 pb-28">
            <OfflineBanner />
            <MobileHeader
                title={"Hello " + employee?.fullName?.split(" ")[0] || "Home"}
                rightAction={
                    <button
                        onClick={() => router.push("/ess/notifications")}
                        className="relative p-2 text-primary active:opacity-50"
                    >
                        <Bell size={24} strokeWidth={2} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 bg-[#FF3B30] text-white text-[10px] font-bold px-1 rounded-full min-w-[16px] h-4 flex items-center justify-center border-2 border-[var(--ios-secondary-bg)]">
                                {unreadCount > 9 ? "9+" : unreadCount}
                            </span>
                        )}
                    </button>
                }
            />

            <div className="px-4 pt-2">
                {/* Attendance Widget */}
                <div className="bg-[var(--ios-secondary-bg)] rounded-3xl p-6 shadow-sm mb-6 border border-[var(--ios-separator)]">
                    <div className="flex flex-col items-center text-center">
                        <p className="text-[13px] font-semibold text-primary uppercase tracking-wider mb-2">Live Status</p>
                        <h2 className="text-[48px] font-bold tracking-tight text-[var(--ios-label)] font-mono leading-none mb-1">
                            {formatTime(currentTime)}
                        </h2>
                        <p className="text-[15px] text-[var(--ios-secondary-label)] font-medium mb-6">
                            {formatDate(currentTime)}
                        </p>

                        <div className="w-full flex gap-4 mb-6">
                            <div className="flex-1 bg-[var(--ios-system-bg)] p-3 rounded-2xl border border-[var(--ios-separator)] flex flex-col items-center gap-1">
                                <span className="text-[11px] font-bold text-[var(--ios-secondary-label)] uppercase">Clock In</span>
                                <span className="text-[17px] font-semibold text-[var(--ios-label)]">
                                    {todayAttendance?.clockIn ? new Date(todayAttendance.clockIn).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "--:--"}
                                </span>
                            </div>
                            <div className="flex-1 bg-[var(--ios-system-bg)] p-3 rounded-2xl border border-[var(--ios-separator)] flex flex-col items-center gap-1">
                                <span className="text-[11px] font-bold text-[var(--ios-secondary-label)] uppercase">Clock Out</span>
                                <span className="text-[17px] font-semibold text-[var(--ios-label)]">
                                    {todayAttendance?.clockOut ? new Date(todayAttendance.clockOut).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "--:--"}
                                </span>
                            </div>
                        </div>

                        <button
                            id="home-clock-btn"
                            onClick={() => router.push("/ess/attendance")}
                            className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-[17px] active:opacity-80 transition-opacity shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                        >
                            {!todayAttendance || !todayAttendance.clockIn ? (
                                <><LogIn size={20} strokeWidth={2.5} /> Check In</>
                            ) : !todayAttendance.clockOut ? (
                                <><LogOut size={20} strokeWidth={2.5} /> Check Out</>
                            ) : (
                                <><CheckCircle2 size={20} strokeWidth={2.5} /> Shift Completed</>
                            )}
                        </button>
                    </div>
                </div>

                {/* Quick Actions List */}
                <div className="ios-list-group">
                    <h2 className="ios-list-header">Services</h2>
                    <div className="ios-list-content">
                        {quickActions.map((qa) => (
                            <button
                                key={qa.id}
                                id={qa.id}
                                onClick={() => router.push(qa.href)}
                                className="ios-cell w-full text-left"
                            >
                                <div className="w-8 h-8 rounded-[8px] flex items-center justify-center bg-muted/30">
                                    {qa.icon}
                                </div>
                                <span className="text-[17px] font-normal text-[var(--ios-label)]">{qa.label}</span>
                                <ChevronRight className="ios-chevron" size={20} strokeWidth={2.5} />
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col items-center gap-1 opacity-40 mt-12">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-[var(--ios-secondary-label)]">
                        <Smartphone size={12} /> DigiHR+ Mobile Platform
                    </div>
                    <p className="text-[10px] text-[var(--ios-secondary-label)] font-medium">Mobile DigiHR+ v1.1.0</p>
                </div>
            </div>

            <EssNav />
        </div>
    );
}
