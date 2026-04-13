"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, Check, CheckCheck, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import Link from "next/link";

type Notification = {
    id: string;
    type: string;
    title: string;
    message: string;
    link?: string | null;
    isRead: boolean;
    emailSent: boolean;
    createdAt: string;
};

const typeColorMap: Record<string, string> = {
    APPROVAL_NEEDED: "bg-blue-500",
    APPROVAL_RESULT: "bg-emerald-500",
    SURAT_ISSUED: "bg-indigo-500",
    PAYROLL_READY: "bg-amber-500",
    GENERAL: "bg-slate-500",
};

function timeAgo(date: string) {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

export function NotificationBell() {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    const fetchNotifications = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/v1/notifications");
            if (!res.ok) return;
            const data = await res.json();
            setNotifications(data.notifications || []);
            setUnreadCount(data.unreadCount || 0);
        } catch {
            // Silent fail - notifications are non-critical
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
        // Poll every 60 seconds for new notifications
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleMarkRead = async (id: string) => {
        await fetch(`/api/v1/notifications/${id}/read`, { method: "POST" });
        setNotifications(prev =>
            prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const handleMarkAllRead = async () => {
        await fetch("/api/v1/notifications/mark-all-read", { method: "POST" });
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
    };

    return (
        <div ref={panelRef} className="relative">
            {/* Bell button */}
            <Button
                id="notification-bell"
                variant="ghost"
                size="icon"
                className="rounded-xl relative"
                onClick={() => { setOpen(o => !o); if (!open) fetchNotifications(); }}
            >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center">
                        <span className="animate-ping absolute h-3 w-3 rounded-full bg-destructive/60" />
                        <span className="relative flex h-4 w-4 rounded-full bg-destructive items-center justify-center text-[9px] font-bold text-white">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    </span>
                )}
            </Button>

            {/* Dropdown panel */}
            {open && (
                <div className="absolute right-0 top-12 w-[380px] z-50 rounded-xl border border-white/10 shadow-2xl shadow-black/40 overflow-hidden animate-fade-in">
                    {/* Header */}
                    <div className="glass-sidebar flex items-center justify-between px-4 py-3 border-b border-white/10">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm">Notifications</h3>
                            {unreadCount > 0 && (
                                <Badge variant="destructive" className="h-5 text-[10px] px-1.5">{unreadCount} new</Badge>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-xs text-primary hover:underline flex items-center gap-1"
                            >
                                <CheckCheck className="w-3.5 h-3.5" />
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* Notification list */}
                    <ScrollArea className="max-h-[420px] glass-sidebar">
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="py-12 text-center">
                                <Bell className="w-10 h-10 text-white/10 mx-auto mb-3" />
                                <p className="text-sm text-muted-foreground">You&apos;re all caught up!</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {notifications.map((n) => (
                                    <div
                                        key={n.id}
                                        className={cn(
                                            "flex gap-3 p-4 transition-colors hover:bg-white/5 cursor-pointer group",
                                            !n.isRead && "bg-primary/5"
                                        )}
                                        onClick={() => !n.isRead && handleMarkRead(n.id)}
                                    >
                                        {/* Type dot */}
                                        <div className="shrink-0 mt-1">
                                            <span className={cn("w-2.5 h-2.5 rounded-full block mt-0.5", typeColorMap[n.type] || "bg-slate-500")} />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className={cn("text-sm font-medium leading-tight", !n.isRead ? "text-foreground" : "text-muted-foreground")}>
                                                    {n.title}
                                                </p>
                                                <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(n.createdAt)}</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.message}</p>

                                            {/* Actions row */}
                                            <div className="flex items-center gap-3 mt-2">
                                                {n.link && (
                                                    <Link
                                                        href={n.link}
                                                        onClick={() => setOpen(false)}
                                                        className="text-[11px] text-primary hover:underline flex items-center gap-1"
                                                    >
                                                        <ExternalLink className="w-3 h-3" /> View
                                                    </Link>
                                                )}
                                                {!n.isRead && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleMarkRead(n.id); }}
                                                        className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Check className="w-3 h-3" /> Mark read
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {!n.isRead && (
                                            <div className="shrink-0 mt-1">
                                                <span className="block w-1.5 h-1.5 rounded-full bg-primary" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="glass-sidebar border-t border-white/10 px-4 py-2.5 text-center">
                            <p className="text-xs text-muted-foreground">Showing last {notifications.length} notifications</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
