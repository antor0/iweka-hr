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

export function Topbar() {
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await fetch("/api/v1/auth/logout", { method: "POST" });
            router.push("/login");
            router.refresh();
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    return (
        <header className="sticky top-0 z-30 glass-sidebar h-16 flex items-center justify-between px-6 border-b border-sidebar-border">
            {/* Search */}
            <div className="flex items-center gap-3 flex-1 max-w-md">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search employees, menu, or features..."
                        className="pl-10 h-9 text-sm bg-transparent"
                    />
                </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
                <ThemeToggle />

                {/* Notifications */}
                <Button variant="ghost" size="icon" className="rounded-xl relative">
                    <Bell className="h-4 w-4" />
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center">
                        <span className="animate-ping absolute h-3 w-3 rounded-full bg-destructive/60" />
                        <span className="relative flex h-2.5 w-2.5 rounded-full bg-destructive" />
                    </span>
                </Button>

                {/* User menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-secondary transition-colors">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src="" />
                                <AvatarFallback>WW</AvatarFallback>
                            </Avatar>
                            <div className="hidden sm:flex flex-col items-start">
                                <span className="text-sm font-medium text-foreground leading-tight">
                                    Wisesa W.
                                </span>
                                <span className="text-[10px] text-muted-foreground leading-tight">
                                    HR Admin
                                </span>
                            </div>
                            <ChevronDown className="h-3 w-3 text-muted-foreground hidden sm:block" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel className="flex flex-col">
                            <span>Wisesa Widyantoro</span>
                            <span className="text-xs text-muted-foreground font-normal">
                                wisesa@company.co.id
                            </span>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>My Profile</DropdownMenuItem>
                        <DropdownMenuItem>Settings</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive cursor-pointer" onClick={handleLogout}>
                            Sign Out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
