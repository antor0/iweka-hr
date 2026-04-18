"use client";

import { useState } from "react";
import { GlassCard } from "@/components/liquid-glass/glass-card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Play, TableProperties, Settings2, FileSpreadsheet } from "lucide-react";

const MODULES = {
    employees: {
        label: "Employees",
        fields: [
            { id: "id", label: "ID" },
            { id: "employeeNumber", label: "Employee Number" },
            { id: "fullName", label: "Full Name" },
            { id: "email", label: "Email" },
            { id: "phone", label: "Phone" },
            { id: "gender", label: "Gender" },
            { id: "employmentStatus", label: "Status" },
            { id: "employmentType", label: "Type" },
            { id: "department.name", label: "Department" },
            { id: "position.title", label: "Position" },
        ]
    },
    attendance: {
        label: "Attendance",
        fields: [
            { id: "id", label: "Record ID" },
            { id: "employee.employeeNumber", label: "Employee Number" },
            { id: "employee.fullName", label: "Full Name" },
            { id: "employee.department.name", label: "Department" },
            { id: "date", label: "Date" },
            { id: "clockIn", label: "Clock In" },
            { id: "clockOut", label: "Clock Out" },
            { id: "status", label: "Status" },
            { id: "workHours", label: "Work Hours" },
        ]
    },
    leave: {
        label: "Leave History",
        fields: [
            { id: "id", label: "Record ID" },
            { id: "employee.employeeNumber", label: "Employee Number" },
            { id: "employee.fullName", label: "Full Name" },
            { id: "leaveType.name", label: "Leave Type" },
            { id: "startDate", label: "Start Date" },
            { id: "endDate", label: "End Date" },
            { id: "totalDays", label: "Total Days" },
            { id: "status", label: "Status" },
        ]
    },
    payroll: {
        label: "Payroll Data",
        fields: [
            { id: "id", label: "Record ID" },
            { id: "employee.employeeNumber", label: "Employee Number" },
            { id: "employee.fullName", label: "Full Name" },
            { id: "employee.department.name", label: "Department" },
            { id: "payrollRun.periodMonth", label: "Month" },
            { id: "payrollRun.periodYear", label: "Year" },
            { id: "grossIncome", label: "Gross Income" },
            { id: "totalDeductions", label: "Total Deductions" },
            { id: "netSalary", label: "Net Salary" },
        ]
    }
};

type ModuleKey = keyof typeof MODULES;

export default function CustomReportPage() {
    const [selectedModule, setSelectedModule] = useState<ModuleKey>("employees");
    const [selectedFields, setSelectedFields] = useState<string[]>(MODULES["employees"].fields.slice(0, 5).map(f => f.id));
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleModuleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const mod = e.target.value as ModuleKey;
        setSelectedModule(mod);
        setSelectedFields(MODULES[mod].fields.slice(0, 5).map(f => f.id));
        setPreviewData([]);
    };

    const toggleField = (fieldId: string) => {
        setSelectedFields(prev =>
            prev.includes(fieldId)
                ? prev.filter(f => f !== fieldId)
                : [...prev, fieldId]
        );
    };

    const generatePreview = async () => {
        if (selectedFields.length === 0) {
            setError("Please select at least one field.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/v1/reports/custom', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    module: selectedModule,
                    fields: selectedFields,
                    filters: {}
                })
            });

            if (!res.ok) throw new Error("Failed to generate report.");

            const json = await res.json();
            if (!json.success) throw new Error(json.error || "Failed to generate report.");

            setPreviewData(json.data);
        } catch (err: any) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const downloadReport = async (format: 'csv' | 'xlsx') => {
        if (selectedFields.length === 0) {
            setError("Please select at least one field.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`/api/v1/reports/custom?format=${format}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    module: selectedModule,
                    fields: selectedFields,
                    filters: {}
                })
            });

            if (!res.ok) {
                const json = await res.json().catch(() => null);
                throw new Error(json?.error || "Failed to download report.");
            }

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;

            // Extract filename from Content-Disposition header if possible
            const contentDisposition = res.headers.get("content-disposition");
            let filename = `custom_report_${selectedModule}_${new Date().getTime()}.${format}`;
            if (contentDisposition && contentDisposition.indexOf('filename=') !== -1) {
                const filenameMatch = contentDisposition.match(/filename="(.+)"/);
                if (filenameMatch && filenameMatch.length === 2) {
                    filename = filenameMatch[1];
                }
            }

            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } catch (err: any) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    <TableProperties className="h-8 w-8 text-primary" />
                    Custom Report Builder
                </h1>
                <p className="text-muted-foreground mt-1">Design your own data exports by selecting modules, fields, and filters.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-6">
                    <GlassCard className="p-5 space-y-4">
                        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                            <Settings2 className="h-5 w-5 text-indigo-400" />
                            <h2 className="font-semibold text-lg">Configuration</h2>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Data Module</label>
                            <select
                                className="w-full bg-slate-900/50 border border-white/10 rounded-md p-2 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none"
                                value={selectedModule}
                                onChange={handleModuleChange}
                            >
                                {Object.entries(MODULES).map(([key, mod]) => (
                                    <option key={key} value={key}>{mod.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2 pt-2">
                            <label className="text-sm font-medium text-muted-foreground flex justify-between">
                                Fields to Include
                                <span className="text-xs text-primary">{selectedFields.length} selected</span>
                            </label>
                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {MODULES[selectedModule].fields.map((field) => (
                                    <label key={field.id} className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-white/5">
                                        <input
                                            type="checkbox"
                                            checked={selectedFields.includes(field.id)}
                                            onChange={() => toggleField(field.id)}
                                            className="w-4 h-4 rounded border-gray-400 text-primary bg-slate-900/50"
                                        />
                                        <span className="text-sm text-foreground">{field.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="pt-4 space-y-3">
                            <Button className="w-full gap-2" onClick={generatePreview} disabled={loading}>
                                <Play className="h-4 w-4" />
                                {loading ? 'Generating...' : 'Run Report'}
                            </Button>

                            <div className="flex gap-2">
                                <Button
                                    className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700"
                                    variant="outline"
                                    onClick={() => downloadReport('xlsx')}
                                    disabled={previewData.length === 0 || loading}
                                >
                                    <FileSpreadsheet className="h-4 w-4" />
                                    Excel
                                </Button>

                                <Button
                                    className="flex-1 gap-2 text-foreground"
                                    variant="outline"
                                    onClick={() => downloadReport('csv')}
                                    disabled={previewData.length === 0 || loading}
                                >
                                    <Download className="h-4 w-4" />
                                    CSV
                                </Button>
                            </div>
                        </div>
                    </GlassCard>
                </div>

                <div className="md:col-span-2">
                    <GlassCard className="p-5 h-full min-h-[500px] flex flex-col">
                        <div className="mb-4">
                            <h2 className="font-semibold text-lg border-b border-white/10 pb-3">Data Preview</h2>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-md text-sm mb-4">
                                {error}
                            </div>
                        )}

                        <div className="flex-1 overflow-auto rounded-md border border-white/10">
                            {previewData.length === 0 ? (
                                <div className="h-full flex items-center justify-center flex-col text-muted-foreground p-10 text-center">
                                    <TableProperties className="h-12 w-12 mb-3 opacity-20" />
                                    <p>No data preview available.</p>
                                    <p className="text-xs mt-1">Configure your report and click 'Run Report'</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-white/5 border-white/10 hover:bg-white/5">
                                            {selectedFields.map(fieldId => {
                                                const fieldDef = MODULES[selectedModule].fields.find(f => f.id === fieldId);
                                                return <TableHead key={fieldId} className="whitespace-nowrap text-muted-foreground">{fieldDef?.label || fieldId}</TableHead>;
                                            })}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {previewData.slice(0, 50).map((row, idx) => (
                                            <TableRow key={idx} className="border-white/10 hover:bg-white/5">
                                                {selectedFields.map(fieldId => (
                                                    <TableCell key={fieldId} className="whitespace-nowrap">
                                                        {row[fieldId] !== null && row[fieldId] !== undefined ? String(row[fieldId]) : '-'}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </div>
                        {previewData.length > 0 && (
                            <div className="mt-3 text-xs text-muted-foreground text-right border-t border-white/10 pt-3">
                                Showing {previewData.length > 50 ? 'first 50 of ' : ''}{previewData.length} records matching your criteria.
                            </div>
                        )}
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}
