"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    LayoutDashboard,
    Users,
    Building2,
    Clock,
    CalendarDays,
    Wallet,
    Receipt,
    HeartPulse,
    BarChart3,
    Settings,
    UserCircle,
    ChevronLeft,
    ChevronRight,
    Briefcase,
    FileText,
} from "lucide-react";

import { Permission, hasPermission } from "@/lib/auth/permissions-config";

interface NavItem {
    title: string;
    href: string;
    icon: React.ReactNode;
    badge?: string;
    permission?: Permission;
}

const navItems: NavItem[] = [
    {
        title: "Dashboard",
        href: "/dashboard",
        icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
        title: "Employees",
        href: "/employees",
        icon: <Users className="h-5 w-5" />,
        permission: "employees.read",
    },
    {
        title: "Organization",
        href: "/organization",
        icon: <Building2 className="h-5 w-5" />,
        permission: "organization.read",
    },
    {
        title: "Attendance",
        href: "/attendance",
        icon: <Clock className="h-5 w-5" />,
        permission: "attendance.read",
    },
    {
        title: "Leave",
        href: "/leave",
        icon: <CalendarDays className="h-5 w-5" />,
        permission: "leave.read",
    },
    {
        title: "Claims",
        href: "/claims",
        icon: <FileText className="h-5 w-5" />,
        permission: "claims.read",
    },
    {
        title: "Payroll",
        href: "/payroll",
        icon: <Wallet className="h-5 w-5" />,
        permission: "payroll.read",
    },
    {
        title: "Tax (PPh 21)",
        href: "/tax",
        icon: <Receipt className="h-5 w-5" />,
        permission: "payroll.read",
    },
    {
        title: "BPJS",
        href: "/bpjs",
        icon: <HeartPulse className="h-5 w-5" />,
        permission: "payroll.read",
    },
    {
        title: "Recruitment",
        href: "/recruitment",
        icon: <Briefcase className="h-5 w-5" />,
        permission: "recruitment.manage",
    },
    {
        title: "Reports",
        href: "/reports",
        icon: <BarChart3 className="h-5 w-5" />,
        permission: "reports.read",
    },
];

const bottomNavItems: NavItem[] = [
    {
        title: "My Profile",
        href: "/my/profile",
        icon: <UserCircle className="h-5 w-5" />,
    },
    {
        title: "Settings",
        href: "/settings",
        icon: <Settings className="h-5 w-5" />,
        permission: "settings.manage",
    },
];

export function Sidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = React.useState(false);
    const [role, setRole] = React.useState<string | null>(null);

    React.useEffect(() => {
        fetch("/api/v1/auth/session")
            .then((res) => res.json())
            .then((data) => {
                if (data.session && data.session.role) {
                    setRole(data.session.role);
                }
            })
            .catch((err) => console.error("Failed to fetch session", err));
    }, []);

    const filteredNavItems = React.useMemo(() => {
        return navItems.filter((item) => !item.permission || (role && hasPermission(role, item.permission)));
    }, [role]);

    const filteredBottomNavItems = React.useMemo(() => {
        return bottomNavItems.filter((item) => !item.permission || (role && hasPermission(role, item.permission)));
    }, [role]);

    return (
        <aside
            className={cn(
                "fixed left-0 top-0 z-40 h-screen glass-sidebar transition-all duration-300 ease-in-out flex flex-col",
                collapsed ? "w-[72px]" : "w-[260px]"
            )}
        >
            {/* Logo area */}
            <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border shrink-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-white font-bold text-sm shrink-0">
                    HR
                </div>
                {!collapsed && (
                    <div className="flex flex-col overflow-hidden animate-fade-in">
                        <span className="text-sm font-bold text-foreground tracking-tight">
                            DigiHR+
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                            Human Resources
                        </span>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <ScrollArea className="flex-1 py-3">
                <nav className="flex flex-col gap-1 px-3">
                    {filteredNavItems.map((item) => {
                        const isActive =
                            pathname === item.href || pathname?.startsWith(item.href + "/");

                        const linkContent = (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                                    "hover:bg-[var(--sidebar-item-hover)]",
                                    isActive
                                        ? "bg-[var(--sidebar-item-active)] text-primary shadow-sm"
                                        : "text-muted-foreground hover:text-foreground",
                                    collapsed && "justify-center px-0"
                                )}
                            >
                                <span
                                    className={cn(
                                        "shrink-0 transition-transform duration-200",
                                        isActive && "scale-110"
                                    )}
                                >
                                    {item.icon}
                                </span>
                                {!collapsed && (
                                    <span className="truncate">{item.title}</span>
                                )}
                                {!collapsed && item.badge && (
                                    <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                                        {item.badge}
                                    </span>
                                )}
                            </Link>
                        );

                        if (collapsed) {
                            return (
                                <Tooltip key={item.href} delayDuration={0}>
                                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                                    <TooltipContent side="right" className="font-medium">
                                        {item.title}
                                    </TooltipContent>
                                </Tooltip>
                            );
                        }

                        return linkContent;
                    })}
                </nav>
            </ScrollArea>

            {/* Bottom nav */}
            <div className="border-t border-sidebar-border px-3 py-3 flex flex-col gap-1 shrink-0">
                {filteredBottomNavItems.map((item) => {
                    const isActive =
                        pathname === item.href || pathname?.startsWith(item.href + "/");

                    const linkContent = (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                                "hover:bg-[var(--sidebar-item-hover)]",
                                isActive
                                    ? "bg-[var(--sidebar-item-active)] text-primary"
                                    : "text-muted-foreground hover:text-foreground",
                                collapsed && "justify-center px-0"
                            )}
                        >
                            <span className="shrink-0">{item.icon}</span>
                            {!collapsed && <span className="truncate">{item.title}</span>}
                        </Link>
                    );

                    if (collapsed) {
                        return (
                            <Tooltip key={item.href} delayDuration={0}>
                                <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                                <TooltipContent side="right" className="font-medium">
                                    {item.title}
                                </TooltipContent>
                            </Tooltip>
                        );
                    }

                    return linkContent;
                })}

                {/* Collapse toggle */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                        "text-muted-foreground hover:text-foreground hover:bg-[var(--sidebar-item-hover)]",
                        collapsed && "justify-center px-0"
                    )}
                >
                    {collapsed ? (
                        <ChevronRight className="h-5 w-5" />
                    ) : (
                        <>
                            <ChevronLeft className="h-5 w-5" />
                            <span>Minimize</span>
                        </>
                    )}
                </button>
            </div>
        </aside>
    );
}
