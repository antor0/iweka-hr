"use client";

import { usePathname, useRouter } from "next/navigation";

const navItems = [
    {
        id: "nav-home",
        label: "Home",
        href: "/ess/home",
        icon: (active: boolean) => (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "#818cf8" : "#475569"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <polyline points="9,22 9,12 15,12 15,22" />
            </svg>
        ),
    },
    {
        id: "nav-attendance",
        label: "Attendance",
        href: "/ess/attendance",
        icon: (active: boolean) => (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "#818cf8" : "#475569"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12,6 12,12 16,14" />
            </svg>
        ),
    },
    {
        id: "nav-payslip",
        label: "Payslip",
        href: "/ess/payslip",
        icon: (active: boolean) => (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "#818cf8" : "#475569"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14,2 14,8 20,8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
        ),
    },
    {
        id: "nav-leave",
        label: "Leave",
        href: "/ess/leave",
        icon: (active: boolean) => (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "#818cf8" : "#475569"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
        ),
    },
    {
        id: "nav-more",
        label: "Claims",
        href: "/ess/claims",
        icon: (active: boolean) => (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "#818cf8" : "#475569"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
            </svg>
        ),
    },
];

export function EssNav() {
    const pathname = usePathname();
    const router = useRouter();

    return (
        <nav style={navStyles.nav}>
            <div style={navStyles.inner}>
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href === "/ess/claims" && (pathname.startsWith("/ess/claims") || pathname.startsWith("/ess/settings")));
                    return (
                        <button
                            key={item.id}
                            id={item.id}
                            onClick={() => router.push(item.href)}
                            style={{
                                ...navStyles.navItem,
                                color: isActive ? "#818cf8" : "#475569",
                            }}
                        >
                            <div style={{ ...navStyles.iconWrapper, background: isActive ? "rgba(99,102,241,0.15)" : "transparent" }}>
                                {item.icon(isActive)}
                            </div>
                            <span style={{
                                ...navStyles.label,
                                color: isActive ? "#818cf8" : "#475569",
                                fontWeight: isActive ? 600 : 400,
                            }}>
                                {item.label}
                            </span>
                            {isActive && <div style={navStyles.activeDot} />}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}

const navStyles: Record<string, React.CSSProperties> = {
    nav: {
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "rgba(10,10,25,0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        zIndex: 100,
        paddingBottom: "env(safe-area-inset-bottom)",
    },
    inner: {
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        padding: "8px 0 4px",
        maxWidth: 480,
        margin: "0 auto",
    },
    navItem: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "4px 8px",
        position: "relative",
        flex: 1,
    },
    iconWrapper: {
        padding: "6px",
        borderRadius: "10px",
        transition: "background 0.2s",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    label: {
        fontSize: 10,
        transition: "color 0.2s",
        fontFamily: "var(--font-sans, Inter, system-ui, sans-serif)",
    },
    activeDot: {
        position: "absolute",
        top: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: 4,
        height: 4,
        borderRadius: "50%",
        background: "#818cf8",
    },
};
