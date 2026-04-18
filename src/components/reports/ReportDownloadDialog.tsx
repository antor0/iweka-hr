"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReportDownloadDialogProps {
    path: string; // e.g. "employees/active"
    title: string;
    description: string;
    allowedFormats?: ("xlsx" | "csv")[];
    filters?: ("period" | "department" | "year-only")[];
    children: React.ReactNode;
}

export function ReportDownloadDialog({
    path,
    title,
    description,
    allowedFormats = ["xlsx", "csv"],
    filters = ["department"],
    children
}: ReportDownloadDialogProps) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [departments, setDepartments] = useState<{ id: string, name: string }[]>([]);

    // Form state
    const [format, setFormat] = useState<"xlsx" | "csv">(allowedFormats[0]);
    const [month, setMonth] = useState<string>(new Date().getMonth() + 1 + "");
    const [year, setYear] = useState<string>(new Date().getFullYear() + "");
    const [departmentId, setDepartmentId] = useState<string>("all");

    // Fetch departments if needed
    useEffect(() => {
        if (open && filters.includes("department") && departments.length === 0) {
            fetch('/api/v1/departments')
                .then(res => res.json())
                .then(data => setDepartments(Array.isArray(data) ? data : []))
                .catch(console.error);
        }
    }, [open, filters, departments.length]);

    const handleDownload = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            params.set("format", format);
            
            if (filters.includes("period") || filters.includes("year-only")) {
                params.set("year", year);
            }
            if (filters.includes("period")) {
                params.set("month", month);
            }
            if (filters.includes("department") && departmentId !== "all") {
                params.set("departmentId", departmentId);
            }

            const url = `/api/v1/reports/${path}?${params.toString()}`;
            
            // For file downloads, we can just navigate to the URL or create a temporary link
            // Using fetch to get blob allows handling errors cleanly
            const response = await fetch(url);
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to generate report");
            }
            
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = downloadUrl;
            
            // Extract filename from Content-Disposition header if possible
            const contentDisposition = response.headers.get("content-disposition");
            let filename = `${path.replace('/', '-')}-${Date.now()}.${format}`;
            if (contentDisposition && contentDisposition.indexOf('filename=') !== -1) {
                const filenameMatch = contentDisposition.match(/filename="(.+)"/);
                if (filenameMatch && filenameMatch.length === 2) {
                    filename = filenameMatch[1];
                }
            }
            
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(downloadUrl);
            a.remove();
            
            toast({ title: "Report generated successfully" });
            setOpen(false);
        } catch (error: any) {
            toast({ 
                title: "Error Generating Report", 
                description: error.message || "An unexpected error occurred", 
                variant: "destructive" 
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {filters.includes("period") && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Month</Label>
                                <Select value={month} onValueChange={setMonth}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Month" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Array.from({ length: 12 }).map((_, i) => (
                                            <SelectItem key={i + 1} value={`${i + 1}`}>
                                                {new Date(0, i).toLocaleString('en', { month: 'long' })}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Year</Label>
                                <Select value={year} onValueChange={setYear}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Year" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Array.from({ length: 5 }).map((_, i) => {
                                            const y = new Date().getFullYear() - 2 + i;
                                            return <SelectItem key={y} value={`${y}`}>{y}</SelectItem>;
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}

                    {filters.includes("year-only") && (
                        <div className="space-y-2">
                            <Label>Year</Label>
                            <Select value={year} onValueChange={setYear}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Year" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.from({ length: 5 }).map((_, i) => {
                                        const y = new Date().getFullYear() - 2 + i;
                                        return <SelectItem key={y} value={`${y}`}>{y}</SelectItem>;
                                    })}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {filters.includes("department") && (
                        <div className="space-y-2">
                            <Label>Department Filter</Label>
                            <Select value={departmentId} onValueChange={setDepartmentId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Departments" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Departments</SelectItem>
                                    {departments.map(d => (
                                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Export Format</Label>
                        <Select value={format} onValueChange={(v: "xlsx" | "csv") => setFormat(v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Format" />
                            </SelectTrigger>
                            <SelectContent>
                                {allowedFormats.includes("xlsx") && <SelectItem value="xlsx">Excel Workbook (.xlsx)</SelectItem>}
                                {allowedFormats.includes("csv") && <SelectItem value="csv">CSV (Comma Delimited)</SelectItem>}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleDownload} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Download className="mr-2 h-4 w-4" />
                        Generate & Download
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
