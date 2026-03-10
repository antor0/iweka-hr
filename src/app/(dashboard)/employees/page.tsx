"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
    Users,
    Plus,
    Search,
    Filter,
    Download,
    Upload,
    MoreHorizontal,
    Mail,
    Phone,
    Building2,
    Briefcase,
    Calendar,
    Loader2,
    ChevronLeft,
    ChevronRight,
    Eye,
    Pencil,
    Trash2
} from "lucide-react";
import { getInitials } from "@/lib/utils";

// Sample employee data
const employees = [
    { id: 1, name: "Rina Kartika", employeeNumber: "EMP-0001", department: "Finance", position: "Finance Staff", status: "active", type: "Permanent", email: "rina@company.co.id", phone: "081234567890", joinDate: "01/02/2026" },
    { id: 2, name: "Budi Santoso", employeeNumber: "EMP-0002", department: "Operations", position: "Operations Supervisor", status: "active", type: "Permanent", email: "budi@company.co.id", phone: "081234567891", joinDate: "15/03/2020" },
    { id: 3, name: "Dewi Sari", employeeNumber: "EMP-0003", department: "Marketing", position: "Marketing Executive", status: "active", type: "Permanent", email: "dewi@company.co.id", phone: "081234567892", joinDate: "01/06/2021" },
    { id: 4, name: "Ahmad Fauzi", employeeNumber: "EMP-0004", department: "IT & Technology", position: "Software Developer", status: "resigned", type: "Permanent", email: "ahmad@company.co.id", phone: "081234567893", joinDate: "10/01/2019" },
    { id: 5, name: "Siti Nurhaliza", employeeNumber: "EMP-0005", department: "Human Resources", position: "HR Specialist", status: "active", type: "Permanent", email: "siti@company.co.id", phone: "081234567894", joinDate: "20/07/2022" },
    { id: 6, name: "Hendra Wijaya", employeeNumber: "EMP-0006", department: "Production", position: "Production Operator", status: "active", type: "Contract", email: "hendra@company.co.id", phone: "081234567895", joinDate: "01/11/2024" },
    { id: 7, name: "Agus Prasetyo", employeeNumber: "EMP-0007", department: "Operations", position: "Warehouse Staff", status: "active", type: "Permanent", email: "agus@company.co.id", phone: "081234567896", joinDate: "05/04/2023" },
    { id: 8, name: "Wulan Anggraini", employeeNumber: "EMP-0008", department: "Finance", position: "Accounting Manager", status: "active", type: "Permanent", email: "wulan@company.co.id", phone: "081234567897", joinDate: "12/08/2018" },
    { id: 9, name: "Dian Permata", employeeNumber: "EMP-0009", department: "Legal", position: "Legal Staff", status: "probation", type: "Permanent", email: "dian@company.co.id", phone: "081234567898", joinDate: "15/01/2026" },
    { id: 10, name: "Reza Mahendra", employeeNumber: "EMP-0010", department: "Marketing", position: "Digital Marketing", status: "active", type: "Contract", email: "reza@company.co.id", phone: "081234567899", joinDate: "01/09/2025" },
];

const statusBadge = (status: string) => {
    switch (status) {
        case "active":
            return <Badge variant="success">Active</Badge>;
        case "probation":
            return <Badge variant="warning">Probation</Badge>;
        case "resigned":
            return <Badge variant="destructive">Resigned</Badge>;
        default:
            return <Badge variant="secondary">{status}</Badge>;
    }
};

export default function EmployeesPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [employees, setEmployees] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [totalEmployees, setTotalEmployees] = useState(0);
    const [page, setPage] = useState(1);
    const limit = 10;

    useEffect(() => {
        fetchEmployees();
    }, [page, searchQuery, statusFilter]);

    const fetchEmployees = async () => {
        try {
            setIsLoading(true);
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                ...(searchQuery && { search: searchQuery }),
                ...(statusFilter !== "all" && { status: statusFilter })
            });
            const res = await fetch(`/api/v1/employees?${queryParams}`);
            const data = await res.json();

            if (data?.data) {
                setEmployees(data.data);
                setTotalEmployees(data.meta?.total || 0);
            }
        } catch (error) {
            console.error("Failed to fetch employees", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        setPage(1); // Reset to first page on search
    };

    const handleTabChange = (val: string) => {
        setStatusFilter(val);
        setPage(1);
    };

    // Calculate generic stats (in a real app, this should come from API metadata too)
    const activeCount = employees.filter(e => e.employmentStatus === "ACTIVE").length;
    const probationCount = employees.filter(e => e.employmentStatus === "PROBATION").length;
    const resignedCount = employees.filter(e => e.employmentStatus === "TERMINATED" || e.employmentStatus === "RESIGNED").length;
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            // Fetch all employees for export
            const res = await fetch(`/api/v1/employees?limit=9999`);
            const data = await res.json();

            if (!data.data || data.data.length === 0) {
                alert("No employees found to export.");
                return;
            }

            // Create simple CSV
            const headers = ["employeeNumber", "nik", "fullName", "email", "phone", "gender", "maritalStatus", "hireDate", "employmentStatus", "employmentType"];
            const csvRows = [
                headers.join(","),
                ...data.data.map((emp: any) => {
                    return headers.map(header => {
                        let val = emp[header] || "";
                        if (header === 'hireDate' && val) val = new Date(val).toISOString().split('T')[0];
                        // Escape quotes and wrap in quotes if contains comma
                        const strVal = String(val).replace(/"/g, '""');
                        return strVal.includes(',') ? `"${strVal}"` : strVal;
                    }).join(",");
                })
            ];

            const csvText = csvRows.join("\n");
            const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `hris_employees_export_${new Date().getTime()}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) {
            console.error("Export failed:", error);
            alert("Export failed.");
        } finally {
            setIsExporting(false);
        }
    };

    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/v1/employees/import", {
                method: "POST",
                body: formData
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Import failed");
            }

            let msg = data.message;
            if (data.failures && data.failures.length > 0) {
                msg += `\nFailed rows: ${data.failedCount}. Check console for details.`;
                console.warn("Import failures:", data.failures);
            }
            alert(msg);

            // Reload page to show new data
            fetchEmployees();

        } catch (error: any) {
            console.error("Import error:", error);
            alert(`Error: ${error.message}`);
        } finally {
            setIsImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = ""; // Reset input
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Page header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
                        <Users className="h-6 w-6 text-primary" />
                        Employee Data
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage all company employee data
                    </p>
                </div>
                <div className="flex gap-2">
                    <input
                        type="file"
                        accept=".csv"
                        ref={fileInputRef}
                        onChange={handleImport}
                        className="hidden"
                    />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" disabled={isImporting}>
                                {isImporting ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Upload className="h-4 w-4 mr-1.5" />}
                                Import
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                                Upload CSV File
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <a href="/templates/employee_import_template.csv" download>
                                    Download Template
                                </a>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting}>
                        {isExporting ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Download className="h-4 w-4 mr-1.5" />}
                        Export
                    </Button>
                    <Button size="sm" asChild>
                        <Link href="/employees/new">
                            <Plus className="h-4 w-4 mr-1.5" /> Add Employee
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={statusFilter} onValueChange={handleTabChange}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <TabsList>
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="active">Active</TabsTrigger>
                        <TabsTrigger value="probation">Probation</TabsTrigger>
                        <TabsTrigger value="resigned">Resigned</TabsTrigger>
                    </TabsList>

                    <div className="flex gap-2 sm:ml-auto">
                        <div className="relative flex-1 sm:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search name, ID, or department..."
                                className="pl-10"
                                value={searchQuery}
                                onChange={handleSearchChange}
                            />
                        </div>
                        <Button variant="outline" size="icon" className="shrink-0">
                            <Filter className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <TabsContent value={statusFilter} className="mt-4">
                    <Card>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-border">
                                            <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Employee</th>
                                            <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">ID Number</th>
                                            <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Department</th>
                                            <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Position</th>
                                            <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Type</th>
                                            <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Status</th>
                                            <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Join Date</th>
                                            <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {isLoading ? (
                                            <tr>
                                                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                                                    Loading employees...
                                                </td>
                                            </tr>
                                        ) : employees.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                                                    No employees found.
                                                </td>
                                            </tr>
                                        ) : employees.map((emp, i) => (
                                            <tr
                                                key={emp.id}
                                                className="border-b border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer group"
                                                style={{ animationDelay: `${i * 50}ms` }}
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-9 w-9">
                                                            <AvatarFallback className="text-xs">
                                                                {getInitials(emp.fullName || "XX")}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="text-sm font-medium text-foreground">{emp.fullName}</p>
                                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                                <Mail className="h-3 w-3" /> {emp.email}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-sm font-mono text-muted-foreground">{emp.employeeNumber}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-1.5 text-sm text-foreground">
                                                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                                                        {emp.department?.name || "-"}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-1.5 text-sm text-foreground">
                                                        <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                                                        {emp.position?.title || "-"}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge variant={emp.employmentType === "PERMANENT" ? "default" : "outline"} className="text-xs">
                                                        {emp.employmentType}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3">{statusBadge(emp.employmentStatus.toLowerCase())}</td>
                                                <td className="px-4 py-3">
                                                    <span className="text-sm text-muted-foreground">
                                                        {(() => {
                                                            const d = new Date(emp.hireDate);
                                                            return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
                                                        })()}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/employees/${emp.id}`}>
                                                                    <Eye className="h-4 w-4 mr-2" /> View Profile
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/employees/${emp.id}/edit`}>
                                                                    <Pencil className="h-4 w-4 mr-2" /> Edit
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={async () => {
                                                                if (confirm("Are you sure you want to delete this employee?")) {
                                                                    try {
                                                                        const res = await fetch(`/api/v1/employees/${emp.id}`, { method: 'DELETE' });
                                                                        if (res.ok) {
                                                                            setEmployees(employees.filter(e => e.id !== emp.id));
                                                                            setTotalEmployees(prev => prev - 1);
                                                                        } else {
                                                                            alert("Failed to delete employee");
                                                                        }
                                                                    } catch (err) {
                                                                        console.error(err);
                                                                    }
                                                                }
                                                            }}>
                                                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {!isLoading && employees.length > 0 && (
                                <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                                    <span className="text-sm text-muted-foreground">
                                        Showing {(page - 1) * limit + 1}-{Math.min(page * limit, totalEmployees)} of {totalEmployees} employees
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={page === 1}
                                            onClick={() => setPage(page - 1)}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <Button variant="default" size="sm" className="h-8 w-8 p-0">{page}</Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={page * limit >= totalEmployees}
                                            onClick={() => setPage(page + 1)}
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
