"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
    Bell, 
    Inbox, 
    CheckCircle2, 
    AlertCircle, 
    Calendar, 
    CreditCard, 
    Clock,
    Info,
    Megaphone,
    MailCheck,
    ChevronRight
} from "lucide-react";
import { MobileHeader } from "../components/mobile-header";
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
            <div className="min-h-screen bg-[var(--ios-system-bg)] flex flex-col items-center justify-center">
                <div className="w-8 h-8 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="min-h-screen bg-[var(--ios-system-bg)] pb-24 font-sans">
            <OfflineBanner />
            <MobileHeader 
                title="Notifications" 
                showBack 
                rightAction={unreadCount > 0 && (
                    <button 
                        onClick={handleMarkAllRead} 
                        className="p-2 text-primary active:opacity-50"
                        title="Mark All Read"
                    >
                        <MailCheck size={24} strokeWidth={2} />
                    </button>
                )}
            />

            <div className="max-w-[480px] mx-auto pt-2">
                <div className="ios-list-group">
                    <h2 className="ios-list-header px-4 flex justify-between items-center">
                        <span>Latest Updates</span>
                        {unreadCount > 0 && (
                            <span className="text-primary font-bold lowercase tracking-normal">
                                {unreadCount} unread
                            </span>
                        )}
                    </h2>
                    <div className="ios-list-content">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 opacity-30">
                                <Inbox size={64} strokeWidth={1} />
                                <p className="text-[17px] font-medium mt-4">No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map((notif) => {
                                const Icon = typeIcons[notif.type] || Info;
                                return (
                                    <button 
                                        key={notif.id} 
                                        onClick={() => handleNotificationClick(notif)}
                                        className="ios-cell items-start py-4 text-left w-full relative"
                                    >
                                        <div className="flex-shrink-0 mt-1 mr-[-8px]">
                                            {!notif.isRead ? (
                                                <div className="w-[10px] h-[10px] bg-primary rounded-full mt-1.5" />
                                            ) : (
                                                <div className="w-[10px] h-[10px]" />
                                            )}
                                        </div>
                                        
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${notif.isRead ? "bg-muted/30 text-[var(--ios-secondary-label)]" : "bg-primary/10 text-primary"}`}>
                                            <Icon size={20} />
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className={`text-[13px] font-bold uppercase tracking-tight ${notif.isRead ? "text-[var(--ios-secondary-label)]" : "text-primary"}`}>
                                                    {notif.type.replace("_", " ")}
                                                </p>
                                                <span className="text-[13px] text-[var(--ios-secondary-label)] font-medium">
                                                    {new Date(notif.createdAt).toLocaleDateString("id-ID", { month: "short", day: "numeric" })}
                                                </span>
                                            </div>
                                            <h3 className={`text-[17px] mt-0.5 leading-snug ${notif.isRead ? "font-normal text-[var(--ios-label)]/60" : "font-bold text-[var(--ios-label)]"}`}>
                                                {notif.title}
                                            </h3>
                                            <p className={`text-[15px] mt-1 leading-relaxed ${notif.isRead ? "text-[var(--ios-secondary-label)]/70" : "text-[var(--ios-secondary-label)]"}`}>
                                                {notif.message}
                                            </p>
                                        </div>
                                        <ChevronRight className="ios-chevron mt-1" size={18} />
                                    </button>
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
