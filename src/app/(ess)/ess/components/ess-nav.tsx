"use client";

import { usePathname, useRouter } from "next/navigation";
import {
    Home,
    Clock,
    FileText,
    Calendar,
    CheckSquare,
    LayoutGrid,
    Wallet
} from "lucide-react";

const navItems = [
    {
        id: "nav-home",
        label: "Home",
        href: "/ess/home",
        icon: (active: boolean) => <Home size={20} strokeWidth={active ? 3 : 2.5} />,
    },
    {
        id: "nav-attendance",
        label: "Clock",
        href: "/ess/attendance",
        icon: (active: boolean) => <Clock size={20} strokeWidth={active ? 3 : 2.5} />,
    },
    {
        id: "nav-payslip",
        label: "Income",
        href: "/ess/payslip",
        icon: (active: boolean) => <Wallet size={20} strokeWidth={active ? 3 : 2.5} />,
    },
    {
        id: "nav-approvals",
        label: "Tasks",
        href: "/ess/approvals",
        icon: (active: boolean) => <CheckSquare size={20} strokeWidth={active ? 3 : 2.5} />,
    },
    {
        id: "nav-more",
        label: "Misc",
        href: "/ess/claims",
        icon: (active: boolean) => <LayoutGrid size={20} strokeWidth={active ? 3 : 2.5} />,
    },
];

export function EssNav() {
    const pathname = usePathname();
    const router = useRouter();

    return (
        <nav className="fixed bottom-0 left-0 right-0 glass backdrop-blur-[40px] z-[100] border-t border-white/10 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
            <div className="flex justify-around items-center max-w-[480px] mx-auto px-1 py-3">
                {navItems.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href === "/ess/claims" && (pathname.startsWith("/ess/claims") || pathname.startsWith("/ess/settings") || pathname.startsWith("/ess/notifications")));

                    return (
                        <button
                            key={item.id}
                            id={item.id}
                            onClick={() => router.push(item.href)}
                            className={`flex flex-col items-center gap-1.5 flex-1 relative transition-all duration-300 active:scale-90 ${isActive ? "text-primary scale-105" : "text-muted-foreground/60 font-medium"
                                }`}
                        >
                            <div className={`p-2.5 rounded-[18px] transition-all duration-500 relative ${isActive
                                    ? "bg-primary/10 shadow-[0_0_20px_rgba(99,102,241,0.2)] text-primary"
                                    : "bg-transparent hover:bg-muted/30"
                                }`}>
                                {item.icon(isActive)}
                                {isActive && (
                                    <div className="absolute inset-0 rounded-[18px] border border-primary/20 animate-pulse" />
                                )}
                            </div>
                            <span className={`text-[9px] font-black uppercase tracking-[0.1em] transition-all duration-300 ${isActive ? "opacity-100" : "opacity-0 -translate-y-1"}`}>
                                {item.label}
                            </span>

                            {isActive && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex flex-col items-center">
                                    <div className="w-6 h-3 bg-primary/20 blur-[8px] rounded-full" />
                                    <div className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_12px_rgba(99,102,241,0.8)] -mt-1" />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}

