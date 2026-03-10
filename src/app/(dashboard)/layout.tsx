"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { BackgroundOrbs } from "@/components/liquid-glass/background-orbs";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen relative">
            <BackgroundOrbs />

            {/* Sidebar */}
            <Sidebar />

            {/* Main content area - offset by sidebar width */}
            <div className="pl-[260px] transition-all duration-300 relative z-10">
                <Topbar />
                <main className="p-6">{children}</main>
            </div>
        </div>
    );
}
