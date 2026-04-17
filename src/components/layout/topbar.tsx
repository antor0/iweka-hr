"use client";

import * as React from "react";
import { Bell, Search, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "./theme-toggle";
import { useRouter } from "next/navigation";
import { NotificationBell } from "./notification-bell";
import { CommandPalette } from "./command-palette";

export function Topbar() {
    const router = useRouter();
    const [user, setUser] = React.useState<any>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [searchOpen, setSearchOpen] = React.useState(false);

    React.useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch("/api/v1/auth/me");
                const data = await res.json();
                if (data?.success) {
                    setUser(data.data);
                }
            } catch (error) {
                console.error("Failed to fetch user in Topbar", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUser();
    }, []);

    const handleLogout = async () => {
        try {
            await fetch("/api/v1/auth/logout", { method: "POST" });
            router.push("/login");
            router.refresh();
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    const getInitials = (name: string) => {
        if (!name) return "??";
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .substring(0, 2);
    };

    return (
        <header className="sticky top-0 z-30 glass-sidebar h-16 flex items-center justify-between px-6 border-b border-sidebar-border">
            {/* Search */}
            <div className="flex items-center gap-3 flex-1 max-w-md">
                <button 
                    onClick={() => setSearchOpen(true)}
                    className="relative w-full flex items-center justify-between h-9 px-3 rounded-xl border border-input bg-transparent hover:bg-accent/50 hover:text-accent-foreground text-sm text-muted-foreground transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <Search className="h-4 w-4" />
                        <span>Search employees, menu, or features...</span>
                    </div>
                    <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
                        <span className="text-xs">⌘</span>K
                    </kbd>
                </button>
            </div>

            <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />

            {/* Right side */}
            <div className="flex items-center gap-2">
                <ThemeToggle />

                <NotificationBell />

                {/* User menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-secondary transition-colors group">
                            <Avatar className="h-8 w-8 ring-offset-background group-hover:ring-2 ring-primary/20 transition-all">
                                <AvatarImage src={user?.photoUrl || ""} />
                                <AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary">
                                    {isLoading ? "..." : getInitials(user?.fullName || "User")}
                                </AvatarFallback>
                            </Avatar>
                            <div className="hidden sm:flex flex-col items-start min-w-[80px]">
                                <span className="text-sm font-semibold text-foreground leading-tight truncate max-w-[120px]">
                                    {isLoading ? "Loading..." : user?.fullName}
                                </span>
                                <span className="text-[10px] text-muted-foreground leading-tight">
                                    {isLoading ? "..." : (user?.position || user?.role?.replace("_", " "))}
                                </span>
                            </div>
                            <ChevronDown className="h-3 w-3 text-muted-foreground hidden sm:block group-hover:text-primary transition-colors" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 mt-2 rounded-xl shadow-lg border-sidebar-border">
                        <DropdownMenuLabel className="flex flex-col py-2 px-3">
                            <span className="font-semibold text-sm truncate">{user?.fullName}</span>
                            <span className="text-xs text-muted-foreground font-normal truncate">
                                {user?.email}
                            </span>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => router.push("/my/profile")}>
                            My Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer gap-2">Settings</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive cursor-pointer gap-2" onClick={handleLogout}>
                            Sign Out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
