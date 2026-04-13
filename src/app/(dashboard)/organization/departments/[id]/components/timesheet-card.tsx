import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileSpreadsheet, Loader2, RefreshCw, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export function DepartmentTimesheetCard({ departmentId }: { departmentId: string }) {
    const today = new Date();
    const [month, setMonth] = useState(today.getMonth() + 1);
    const [year, setYear] = useState(today.getFullYear());
    const [timesheets, setTimesheets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    const [viewOpen, setViewOpen] = useState(false);
    const [selectedEmployeeData, setSelectedEmployeeData] = useState<any>(null);

    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const years = [year - 1, year, year + 1];

    const fetchTimesheets = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/v1/departments/${departmentId}/timesheet?month=${month}&year=${year}`);
            if (res.ok) {
                const json = await res.json();
                setTimesheets(json.data || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTimesheets();
    }, [month, year, departmentId]);

    const handleGenerate = async () => {
        if (timesheets.length > 0) {
            if (!confirm("Regenerate timesheets? This will overwrite existing data for this month.")) return;
        }
        setGenerating(true);
        try {
            const res = await fetch(`/api/v1/departments/${departmentId}/timesheet`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ month, year })
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Failed to generate timesheets");
            
            fetchTimesheets();
        } catch (e: any) {
            alert(e.message);
        } finally {
            setGenerating(false);
        }
    };

    // Group timesheets by employee for summary
    const grouped = timesheets.reduce((acc, ts) => {
        if (!acc[ts.employeeId]) {
            acc[ts.employeeId] = {
                employee: ts.employee,
                days: [],
                stats: { PRESENT: 0, LATE: 0, ABSENT: 0, LEAVE: 0, HOLIDAY: 0, OFF_DAY: 0 }
            };
        }
        acc[ts.employeeId].days.push(ts);
        if (ts.status in acc[ts.employeeId].stats) {
            acc[ts.employeeId].stats[ts.status]++;
        }
        return acc;
    }, {});

    const summaryList = Object.values(grouped).sort((a: any, b: any) => a.employee.fullName.localeCompare(b.employee.fullName)) as any[];

    const handleViewDetails = (data: any) => {
        setSelectedEmployeeData(data);
        setViewOpen(true);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "PRESENT": return "text-emerald-500 bg-emerald-500/10";
            case "LATE": return "text-amber-500 bg-amber-500/10";
            case "ABSENT": return "text-red-500 bg-red-500/10";
            case "LEAVE": return "text-blue-500 bg-blue-500/10";
            case "HOLIDAY": return "text-pink-500 bg-pink-500/10";
            case "OFF_DAY": return "text-slate-500 bg-slate-500/10";
            default: return "text-gray-500 bg-gray-500/10";
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                <CardTitle className="text-lg flex items-center gap-2 mt-0">
                    <FileSpreadsheet className="h-5 w-5 text-emerald-500" />
                    Timesheets
                </CardTitle>
                <div className="flex items-center gap-3">
                    <div className="flex gap-2 text-sm">
                        <Select value={String(month)} onValueChange={v => setMonth(Number(v))}>
                            <SelectTrigger className="w-28 h-8"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {months.map(m => (
                                    <SelectItem key={m} value={String(m)}>
                                        {new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
                            <SelectTrigger className="w-20 h-8"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button size="sm" className="h-8" onClick={handleGenerate} disabled={generating}>
                        {generating ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1" />}
                        Generate Timesheets
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
                {loading ? (
                    <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                ) : summaryList.length === 0 ? (
                    <p className="text-center p-8 text-sm text-muted-foreground italic">No timesheets generated for this month.</p>
                ) : (
                    <div className="p-4">
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="border-b bg-muted/30">
                                    <th className="p-3 font-medium text-left">Employee</th>
                                    <th className="p-3 font-medium text-center text-emerald-600">Present</th>
                                    <th className="p-3 font-medium text-center text-amber-600">Late</th>
                                    <th className="p-3 font-medium text-center text-red-600">Absent</th>
                                    <th className="p-3 font-medium text-center text-blue-600">Leave</th>
                                    <th className="p-3 font-medium text-center text-pink-600">Holiday</th>
                                    <th className="p-3 font-medium text-center text-slate-600">Off</th>
                                    <th className="p-3 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {summaryList.map(data => (
                                    <tr key={data.employee.employeeNumber} className="border-b hover:bg-muted/10 transition-colors">
                                        <td className="p-3">
                                            <div className="font-medium">{data.employee.fullName}</div>
                                            <div className="text-xs text-muted-foreground">{data.employee.employeeNumber}</div>
                                        </td>
                                        <td className="p-3 text-center font-mono">{data.stats.PRESENT}</td>
                                        <td className="p-3 text-center font-mono">{data.stats.LATE}</td>
                                        <td className="p-3 text-center font-mono">{data.stats.ABSENT}</td>
                                        <td className="p-3 text-center font-mono">{data.stats.LEAVE}</td>
                                        <td className="p-3 text-center font-mono">{data.stats.HOLIDAY}</td>
                                        <td className="p-3 text-center font-mono">{data.stats.OFF_DAY}</td>
                                        <td className="p-3 text-right">
                                            <Button variant="ghost" size="sm" onClick={() => handleViewDetails(data)}>
                                                <Eye className="w-4 h-4 mr-1.5" /> View
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>

            <Dialog open={viewOpen} onOpenChange={setViewOpen}>
                <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Timesheet Details: {selectedEmployeeData?.employee.fullName}</DialogTitle>
                    </DialogHeader>
                    <div className="overflow-y-auto flex-1 pb-4">
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="border-b sticky top-0 bg-background z-10 shadow-[0_1px_0_0_#e2e8f0] dark:shadow-[0_1px_0_0_#1e293b]">
                                    <th className="p-2 text-left">Date</th>
                                    <th className="p-2 text-center">Schedule</th>
                                    <th className="p-2 text-center">Clock In</th>
                                    <th className="p-2 text-center">Clock Out</th>
                                    <th className="p-2 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedEmployeeData?.days.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((ts: any) => (
                                    <tr key={ts.id} className="border-b hover:bg-muted/10">
                                        <td className="p-2 font-mono text-xs">{new Date(ts.date).toLocaleDateString(undefined, { timeZone: 'UTC' })}</td>
                                        <td className="p-2 text-center text-xs text-muted-foreground">{ts.scheduledStart} - {ts.scheduledEnd}</td>
                                        <td className="p-2 text-center font-mono text-xs">
                                            {ts.actualClockIn ? new Date(ts.actualClockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-"}
                                        </td>
                                        <td className="p-2 text-center font-mono text-xs">
                                            {ts.actualClockOut ? new Date(ts.actualClockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-"}
                                        </td>
                                        <td className="p-2 text-right">
                                            <span className={`px-2 py-1 rounded text-[10px] font-semibold tracking-wider ${getStatusColor(ts.status)}`}>
                                                {ts.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setViewOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
