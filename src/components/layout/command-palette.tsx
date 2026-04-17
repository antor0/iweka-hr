"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { 
    Search, 
    Loader2, 
    LayoutDashboard, 
    Users, 
    Building2, 
    Clock, 
    CalendarDays, 
    FileText, 
    Wallet, 
    Receipt, 
    HeartPulse, 
    Briefcase, 
    BarChart3, 
    Settings 
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const QUICK_NAVIGATION = [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "Employees", href: "/employees", icon: Users },
    { title: "Organization", href: "/organization", icon: Building2 },
    { title: "Attendance", href: "/attendance", icon: Clock },
    { title: "Leave", href: "/leave", icon: CalendarDays },
    { title: "Claims", href: "/claims", icon: FileText },
    { title: "Payroll", href: "/payroll", icon: Wallet },
    { title: "Tax (PPh 21)", href: "/tax", icon: Receipt },
    { title: "BPJS", href: "/bpjs", icon: HeartPulse },
    { title: "Recruitment", href: "/recruitment", icon: Briefcase },
    { title: "Reports", href: "/reports", icon: BarChart3 },
    { title: "Settings", href: "/settings", icon: Settings },
];

export function CommandPalette({
    open,
    onOpenChange
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const router = useRouter();
    const [query, setQuery] = React.useState("");
    const [isLoading, setIsLoading] = React.useState(false);
    const [results, setResults] = React.useState<any>({
        employees: [],
        departments: [],
        positions: [],
        leaveRequests: [],
        claims: [],
        payrollRuns: []
    });

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                onOpenChange(true);
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [onOpenChange]);

    React.useEffect(() => {
        if (!open) {
            setQuery("");
            setResults({
                employees: [],
                departments: [],
                positions: [],
                leaveRequests: [],
                claims: [],
                payrollRuns: []
            });
            return;
        }

        if (query.trim().length < 2) {
            setResults({
                employees: [],
                departments: [],
                positions: [],
                leaveRequests: [],
                claims: [],
                payrollRuns: []
            });
            return;
        }

        const timer = setTimeout(async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`/api/v1/search?q=${encodeURIComponent(query)}`);
                const json = await res.json();
                if (json.success) {
                    setResults(json.data);
                }
            } catch (error) {
                console.error("Search failed:", error);
            } finally {
                setIsLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query, open]);

    const handleSelect = (href: string) => {
        onOpenChange(false);
        router.push(href);
    };

    const hasNoResults = 
        query.trim().length >= 2 &&
        !isLoading &&
        Object.values(results).every((arr: any) => arr.length === 0);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="fixed top-[15%] translate-y-0 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl shadow-[var(--glass-shadow-lg)] backdrop-blur-[var(--glass-blur-lg)] z-50 overflow-hidden flex flex-col p-0 cmdk-dialog sm:max-w-2xl [&>button]:hidden gap-0">
                <Command shouldFilter={false} className="flex h-full w-full flex-col bg-transparent">
                    <div className="flex items-center px-4 py-3 border-b border-[var(--glass-border)]">
                        <Search className="w-5 h-5 text-muted-foreground mr-3" />
                        <Command.Input 
                            value={query}
                            onValueChange={setQuery}
                            placeholder="Search employees, organization, claims..."
                            className="flex-1 bg-transparent border-none outline-none text-foreground text-sm placeholder:text-muted-foreground"
                        />
                        {isLoading && <Loader2 className="w-4 h-4 text-muted-foreground animate-spin ml-3" />}
                        <div className="ml-3 text-[10px] bg-muted/50 text-muted-foreground px-2 py-1 rounded-md hidden sm:block">
                            ESC
                        </div>
                    </div>

                    <Command.List className="max-h-[60vh] overflow-y-auto p-2 scrollbar-thin">
                {query.length < 2 && (
                    <Command.Group heading="Quick Navigation" className="text-xs text-muted-foreground font-semibold px-2 py-1 uppercase tracking-wider">
                        {QUICK_NAVIGATION.map((item) => (
                            <Command.Item 
                                key={item.href}
                                onSelect={() => handleSelect(item.href)}
                                className="flex items-center gap-3 px-3 py-2 text-sm text-foreground rounded-xl cursor-pointer hover:bg-[var(--sidebar-item-active)] hover:text-primary aria-selected:bg-[var(--sidebar-item-active)] aria-selected:text-primary transition-colors mb-1"
                            >
                                <item.icon className="w-4 h-4 opacity-70" />
                                <span>{item.title}</span>
                            </Command.Item>
                        ))}
                    </Command.Group>
                )}

                {hasNoResults && (
                    <div className="py-14 text-center text-sm text-muted-foreground">
                        No results found for "<span className="text-foreground">{query}</span>"
                    </div>
                )}

                {results.employees?.length > 0 && (
                    <Command.Group heading="Employees">
                        {results.employees.map((emp: any) => (
                            <Command.Item
                                key={`emp-${emp.id}`}
                                onSelect={() => handleSelect(emp.href)}
                                className="flex items-center justify-between px-3 py-2 text-sm text-foreground rounded-xl cursor-pointer hover:bg-[var(--sidebar-item-active)] hover:text-primary aria-selected:bg-[var(--sidebar-item-active)] aria-selected:text-primary transition-colors mb-1 group"
                            >
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8 group-hover:ring-2 ring-primary/20 transition-all">
                                        <AvatarImage src={emp.photoUrl} />
                                        <AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary">
                                            {emp.fullName.substring(0,2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="font-semibold">{emp.fullName}</span>
                                        <span className="text-xs text-muted-foreground">{emp.position || "Employee"} • {emp.department}</span>
                                    </div>
                                </div>
                                <Badge variant="outline" className="text-[10px] shrink-0">{emp.employeeNumber}</Badge>
                            </Command.Item>
                        ))}
                    </Command.Group>
                )}

                {results.departments?.length > 0 && (
                    <Command.Group heading="Departments">
                        {results.departments.map((dept: any) => (
                            <Command.Item
                                key={`dept-${dept.id}`}
                                onSelect={() => handleSelect(dept.href)}
                                className="flex items-center justify-between px-3 py-2 text-sm text-foreground rounded-xl cursor-pointer hover:bg-[var(--sidebar-item-active)] hover:text-primary aria-selected:bg-[var(--sidebar-item-active)] aria-selected:text-primary transition-colors mb-1"
                            >
                                <div className="flex items-center gap-3">
                                    <Building2 className="w-4 h-4 text-muted-foreground" />
                                    <span>{dept.name}</span>
                                </div>
                                <Badge variant="secondary" className="text-[10px]">{dept.code}</Badge>
                            </Command.Item>
                        ))}
                    </Command.Group>
                )}

                {results.positions?.length > 0 && (
                    <Command.Group heading="Positions">
                        {results.positions.map((pos: any) => (
                            <Command.Item
                                key={`pos-${pos.id}`}
                                onSelect={() => handleSelect(pos.href)}
                                className="flex items-center justify-between px-3 py-2 text-sm text-foreground rounded-xl cursor-pointer hover:bg-[var(--sidebar-item-active)] hover:text-primary aria-selected:bg-[var(--sidebar-item-active)] aria-selected:text-primary transition-colors mb-1"
                            >
                                <div className="flex items-center gap-3">
                                    <Briefcase className="w-4 h-4 text-muted-foreground" />
                                    <span>{pos.title}</span>
                                </div>
                                <Badge variant="secondary" className="text-[10px]">{pos.code}</Badge>
                            </Command.Item>
                        ))}
                    </Command.Group>
                )}

                {results.claims?.length > 0 && (
                    <Command.Group heading="Claims">
                        {results.claims.map((claim: any) => (
                            <Command.Item
                                key={`claim-${claim.id}`}
                                onSelect={() => handleSelect(claim.href)}
                                className="flex items-center justify-between px-3 py-2 text-sm text-foreground rounded-xl cursor-pointer hover:bg-[var(--sidebar-item-active)] hover:text-primary aria-selected:bg-[var(--sidebar-item-active)] aria-selected:text-primary transition-colors mb-1"
                            >
                                <div className="flex flex-col">
                                    <span className="font-medium">{claim.title}</span>
                                    <span className="text-xs text-muted-foreground">{claim.employeeName} • {claim.claimNumber}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-xs">Rp {Number(claim.totalAmount).toLocaleString('id-ID')}</span>
                                    <Badge variant={claim.status === 'APPROVED' ? 'default' : claim.status === 'PENDING' ? 'secondary' : 'outline'} className="text-[10px]">
                                        {claim.status}
                                    </Badge>
                                </div>
                            </Command.Item>
                        ))}
                    </Command.Group>
                )}

                {results.leaveRequests?.length > 0 && (
                    <Command.Group heading="Leave Requests">
                        {results.leaveRequests.map((leave: any) => (
                            <Command.Item
                                key={`leave-${leave.id}`}
                                onSelect={() => handleSelect(leave.href)}
                                className="flex items-center justify-between px-3 py-2 text-sm text-foreground rounded-xl cursor-pointer hover:bg-[var(--sidebar-item-active)] hover:text-primary aria-selected:bg-[var(--sidebar-item-active)] aria-selected:text-primary transition-colors mb-1"
                            >
                                <div className="flex flex-col">
                                    <span className="font-medium">{leave.leaveTypeName}</span>
                                    <span className="text-xs text-muted-foreground">{leave.employeeName}</span>
                                </div>
                                <Badge variant="outline" className="text-[10px]">
                                    {leave.status}
                                </Badge>
                            </Command.Item>
                        ))}
                    </Command.Group>
                )}

                {results.payrollRuns?.length > 0 && (
                    <Command.Group heading="Payroll Runs">
                        {results.payrollRuns.map((run: any) => (
                            <Command.Item
                                key={`payroll-${run.id}`}
                                onSelect={() => handleSelect(run.href)}
                                className="flex items-center justify-between px-3 py-2 text-sm text-foreground rounded-xl cursor-pointer hover:bg-[var(--sidebar-item-active)] hover:text-primary aria-selected:bg-[var(--sidebar-item-active)] aria-selected:text-primary transition-colors mb-1"
                            >
                                <div className="flex items-center gap-3">
                                    <Wallet className="w-4 h-4 text-muted-foreground" />
                                    <span>Payroll {run.period}</span>
                                </div>
                                <Badge variant="outline" className="text-[10px]">
                                    {run.status}
                                </Badge>
                            </Command.Item>
                        ))}
                    </Command.Group>
                )}
            </Command.List>
                </Command>
            </DialogContent>
        </Dialog>
    );
}
