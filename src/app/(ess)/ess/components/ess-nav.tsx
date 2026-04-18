"use client";

import { usePathname, useRouter } from "next/navigation";
import {
    Home,
    Clock,
    CheckSquare,
    LayoutGrid,
    Wallet
} from "lucide-react";

/**
 * Navigation items for the ESS PWA.
 * Icons are styled to match iOS HIG active/inactive states.
 */
const navItems = [
    {
        id: "nav-home",
        label: "Home",
        href: "/ess/home",
        icon: (active: boolean) => <Home size={24} strokeWidth={active ? 2.5 : 2} />,
    },
    {
        id: "nav-attendance",
        label: "Attendance",
        href: "/ess/attendance",
        icon: (active: boolean) => <Clock size={24} strokeWidth={active ? 2.5 : 2} />,
    },
    {
        id: "nav-income",
        label: "My Payslip",
        href: "/ess/payslip",
        icon: (active: boolean) => <Wallet size={24} strokeWidth={active ? 2.5 : 2} />,
    },
    {
        id: "nav-approvals",
        label: "Approvals",
        href: "/ess/approvals",
        icon: (active: boolean) => <CheckSquare size={24} strokeWidth={active ? 2.5 : 2} />,
    },
    {
        id: "nav-more",
        label: "Misc",
        href: "/ess/claims",
        icon: (active: boolean) => <LayoutGrid size={24} strokeWidth={active ? 2.5 : 2} />,
    },
];

export function EssNav() {
    const pathname = usePathname();
    const router = useRouter();

    return (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-[100] border-t border-[var(--ios-separator)] bg-[var(--ios-secondary-bg)]/80 backdrop-blur-3xl pb-[env(safe-area-inset-bottom)]">
            <div className="flex justify-around items-center px-2 py-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href === "/ess/claims" && (
                            pathname.startsWith("/ess/claims") ||
                            pathname.startsWith("/ess/settings") ||
                            pathname.startsWith("/ess/notifications") ||
                            pathname.startsWith("/ess/leave")
                        ));

                    return (
                        <button
                            key={item.id}
                            id={item.id}
                            onClick={() => router.push(item.href)}
                            className={`flex flex-col items-center gap-1 flex-1 relative py-1 transition-all active:opacity-50 ${isActive ? "text-primary" : "text-[var(--ios-secondary-label)]"
                                }`}
                        >
                            <div className="relative">
                                {item.icon(isActive)}
                            </div>
                            <span className="text-[10px] font-medium tracking-tight">
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
