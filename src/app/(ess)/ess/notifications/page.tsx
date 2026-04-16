"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
    Bell, 
    ArrowLeft, 
    Inbox, 
    CheckCircle2, 
    AlertCircle, 
    Calendar, 
    CreditCard, 
    Clock,
    Info,
    Megaphone,
    MailCheck
} from "lucide-react";
import { EssNav } from "../components/ess-nav";
import { OfflineBanner } from "../components/offline-banner";

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    link?: string;
    isRead: boolean;
    createdAt: string;
}

const typeIcons: Record<string, any> = {
    LEAVE: Calendar,
    CLAIM: CreditCard,
    ANNOUNCEMENT: Megaphone,
    ATTENDANCE: Clock,
};

export default function EssNotificationsPage() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await fetch("/api/v1/notifications");
            if (res.status === 401) { router.push("/ess"); return; }
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications || []);
            }
        } catch { } finally { setIsLoading(false); }
    }, [router]);

    useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

    const handleMarkAllRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        try {
            await fetch("/api/v1/notifications/mark-all-read", { method: "POST" });
        } catch (error) { console.error("Failed to mark all read"); }
    };

    const handleNotificationClick = async (notif: Notification) => {
        if (!notif.isRead) {
            setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
            fetch(`/api/v1/notifications/${notif.id}/read`, { method: "POST" }).catch(() => {});
        }
        if (notif.link) {
            router.push(notif.link);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
                <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">Loading notifications...</p>
            </div>
        );
    }

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="min-h-screen bg-transparent font-sans relative">
            <OfflineBanner />

            <div className="relative z-10 px-4 pt-6 pb-24 max-w-[480px] mx-auto flex flex-col gap-6">
                <div className="flex justify-between items-center">
                    <button 
                        onClick={() => router.back()} 
                        className="w-10 h-10 rounded-2xl glass flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all active:scale-95"
                    >
                        <ArrowLeft size={18} strokeWidth={2.5} />
                    </button>
                    <h1 className="text-xl font-extrabold text-foreground tracking-tight underline decoration-primary/30 underline-offset-8">Notifications</h1>
                    <div className="w-10" /> {/* Spacer */}
                </div>

                <div className="flex justify-between items-end px-1">
                    <div>
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] opacity-80 flex items-center gap-1.5">
                            <Bell size={12} /> Live Updates
                        </p>
                        <p className="text-[11px] text-muted-foreground font-bold mt-1.5 opacity-70">
                            {unreadCount > 0 ? `${unreadCount} unread message${unreadCount > 1 ? "s" : ""}` : "You're all caught up!"}
                        </p>
                    </div>
                    {unreadCount > 0 && (
                        <button 
                            onClick={handleMarkAllRead} 
                            className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-4 py-2 rounded-xl border border-primary/20 hover:bg-primary/20 transition-all active:scale-95 flex items-center gap-2"
                        >
                            <MailCheck size={14} strokeWidth={2.5} /> Mark All Read
                        </button>
                    )}
                </div>

                {notifications.length === 0 ? (
                    <div className="glass border-dashed border-border/50 rounded-[32px] p-20 flex flex-col items-center justify-center text-center opacity-60">
                        <Inbox size={48} className="text-muted-foreground opacity-30 mb-4" strokeWidth={1.5} />
                        <p className="text-[11px] text-muted-foreground font-black uppercase tracking-widest opacity-60">No notifications yet</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {notifications.map((notif) => {
                            const Icon = typeIcons[notif.type] || Info;
                            return (
                                <div 
                                    key={notif.id} 
                                    onClick={() => handleNotificationClick(notif)}
                                    className={`p-5 rounded-[28px] border transition-all duration-300 relative group overflow-hidden ${
                                        notif.isRead 
                                            ? "glass border-border/50 opacity-80 hover:opacity-100" 
                                            : "glass-accent border-primary/40 shadow-xl shadow-primary/5 scale-[1.01]"
                                    } ${notif.link ? "cursor-pointer active:scale-[0.98]" : "cursor-default"}`}
                                >
                                    {!notif.isRead && (
                                        <div className="absolute top-2 right-2">
                                            <div className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse ring-4 ring-primary/20" />
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center mb-3">
                                        <div className={`flex items-center gap-2 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                            notif.isRead 
                                                ? "bg-muted/50 text-muted-foreground" 
                                                : "bg-primary/20 text-primary"
                                        }`}>
                                            <Icon size={12} strokeWidth={2.5} />
                                            {notif.type.replace("_", " ")}
                                        </div>
                                        <span className="text-[10px] text-muted-foreground font-black font-mono opacity-50 uppercase tracking-tighter">
                                            {new Date(notif.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                        </span>
                                    </div>

                                    <h3 className={`text-sm font-black mb-1.5 leading-snug tracking-tight ${
                                        notif.isRead ? "text-foreground/80" : "text-foreground"
                                    }`}>
                                        {notif.title}
                                    </h3>
                                    <p className={`text-[12px] leading-relaxed font-medium ${
                                        notif.isRead ? "text-muted-foreground/80" : "text-muted-foreground"
                                    }`}>
                                        {notif.message}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <EssNav />
        </div>
    );
}
