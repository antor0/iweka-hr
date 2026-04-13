"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { EssNav } from "../components/ess-nav";

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    link?: string;
    isRead: boolean;
    createdAt: string;
}

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
            // Check if link is an internal pwa link. Often web links are /leave etc. 
            // We can just try to navigate there. For PWA, they might be /ess/approvals
            // Let's just push to router.
            router.push(notif.link);
        }
    };

    if (isLoading) return <div style={s.root}><div style={s.center}><div style={s.spinner} /></div></div>;

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div style={s.root}>
            <div style={s.page}>
                <div style={s.headerRow}>
                    <button onClick={() => router.back()} style={s.backBtn}>← Back</button>
                    <h1 style={s.pageTitle}>Notifications</h1>
                    {unreadCount > 0 ? (
                        <button onClick={handleMarkAllRead} style={s.markReadBtn}>Mark all read</button>
                    ) : <div style={{width: 60}} />}
                </div>

                {notifications.length === 0 ? (
                    <div style={s.emptyState}>
                        <span style={{ fontSize: 40 }}>📭</span>
                        <p style={{ color: "#64748b", margin: "8px 0 0" }}>No notifications yet</p>
                    </div>
                ) : (
                    <div style={s.list}>
                        {notifications.map((notif) => (
                            <div 
                                key={notif.id} 
                                onClick={() => handleNotificationClick(notif)}
                                style={{ ...s.card, background: notif.isRead ? "rgba(255,255,255,0.02)" : "rgba(99,102,241,0.08)", cursor: notif.link ? "pointer" : "default" }}
                            >
                                <div style={s.cardTop}>
                                    <span style={{ ...s.typeBadge, background: notif.isRead ? "rgba(255,255,255,0.1)" : "rgba(99,102,241,0.2)", color: notif.isRead ? "#94a3b8" : "#818cf8" }}>
                                        {notif.type.replace("_", " ")}
                                    </span>
                                    <span style={s.time}>{new Date(notif.createdAt).toLocaleDateString()}</span>
                                </div>
                                <h3 style={{ ...s.title, color: notif.isRead ? "#cbd5e1" : "#e0e7ff" }}>
                                    {notif.title}
                                    {!notif.isRead && <span style={s.unreadDot} />}
                                </h3>
                                <p style={s.message}>{notif.message}</p>
                            </div>
                        ))}
                    </div>
                )}
                
                <div style={{ height: 80 }} />
            </div>
            <EssNav />
        </div>
    );
}

const s: Record<string, any> = {
    root: { minHeight: "100vh", background: "linear-gradient(135deg, #0f0f1a 0%, #1a1033 50%, #0a1628 100%)", fontFamily: "var(--font-sans, Inter, system-ui, sans-serif)" },
    center: { display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" },
    spinner: { width: 36, height: 36, border: "3px solid rgba(99,102,241,0.3)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
    page: { padding: "20px 16px 0", maxWidth: 480, margin: "0 auto" },
    headerRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
    backBtn: { background: "none", border: "none", color: "#818cf8", fontSize: 14, fontWeight: 600, cursor: "pointer", padding: 0 },
    markReadBtn: { background: "none", border: "none", color: "#a5b4fc", fontSize: 12, cursor: "pointer", padding: 0 },
    pageTitle: { margin: 0, fontSize: 18, fontWeight: 700, color: "#fff" },
    emptyState: { display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 20px", background: "rgba(255,255,255,0.02)", borderRadius: 16, border: "1px dashed rgba(255,255,255,0.05)" },
    list: { display: "flex", flexDirection: "column", gap: 12 },
    card: { border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: "16px", transition: "all 0.2s" },
    cardTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
    typeBadge: { padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 700, letterSpacing: "0.05em" },
    time: { fontSize: 11, color: "#64748b" },
    title: { margin: "0 0 6px", fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 },
    unreadDot: { width: 8, height: 8, background: "#ef4444", borderRadius: "50%", display: "inline-block" },
    message: { margin: 0, fontSize: 13, color: "#94a3b8", lineHeight: 1.5 },
};
