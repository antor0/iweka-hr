import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, Loader2, RefreshCw, Trash2, Edit2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function DepartmentScheduleCard({ departmentId }: { departmentId: string }) {
    const today = new Date();
    const [month, setMonth] = useState(today.getMonth() + 1);
    const [year, setYear] = useState(today.getFullYear());
    const [schedules, setSchedules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    const [overrideOpen, setOverrideOpen] = useState(false);
    const [savingOverride, setSavingOverride] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
    const [overrideData, setOverrideData] = useState({
        shiftName: "",
        scheduledStart: "",
        scheduledEnd: ""
    });

    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const years = [year - 1, year, year + 1];

    const fetchSchedule = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/v1/departments/${departmentId}/schedule?month=${month}&year=${year}`);
            if (res.ok) {
                const json = await res.json();
                setSchedules(json.data || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSchedule();
    }, [month, year, departmentId]);

    const handleGenerate = async () => {
        if (schedules.length > 0) {
            if (!confirm("Schedule already exists for this month. Overwrite?")) return;
        }
        setGenerating(true);
        try {
            const res = await fetch(`/api/v1/departments/${departmentId}/schedule`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ month, year })
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Failed to generate schedule");
            
            fetchSchedule();
        } catch (e: any) {
            alert(e.message);
        } finally {
            setGenerating(false);
        }
    };

    const handleClear = async () => {
        if (!confirm("Are you sure you want to clear this month's schedule?")) return;
        setGenerating(true);
        try {
            await fetch(`/api/v1/departments/${departmentId}/schedule?month=${month}&year=${year}`, {
                method: "DELETE"
            });
            fetchSchedule();
        } catch (e: any) {
            alert(e.message);
        } finally {
            setGenerating(false);
        }
    };

    const handleOpenOverride = (sch: any) => {
        setSelectedSchedule(sch);
        setOverrideData({
            shiftName: sch.shiftName || "Off",
            scheduledStart: sch.scheduledStart || "00:00",
            scheduledEnd: sch.scheduledEnd || "00:00"
        });
        setOverrideOpen(true);
    };

    const saveOverride = async () => {
        if (!selectedSchedule) return;
        setSavingOverride(true);
        try {
            const res = await fetch(`/api/v1/departments/${departmentId}/schedule/${selectedSchedule.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(overrideData)
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error);
            }
            setOverrideOpen(false);
            fetchSchedule();
        } catch (e: any) {
            alert("Error: " + e.message);
        } finally {
            setSavingOverride(false);
        }
    };

    // Group schedules by employee
    const grouped = schedules.reduce((acc, sch) => {
        if (!acc[sch.employeeId]) {
            acc[sch.employeeId] = {
                employee: sch.employee,
                days: {}
            };
        }
        const day = new Date(sch.date).getUTCDate();
        acc[sch.employeeId].days[day] = sch;
        return acc;
    }, {});

    const employeesList = Object.values(grouped).sort((a: any, b: any) => a.employee.fullName.localeCompare(b.employee.fullName)) as any[];
    const daysInMonth = new Date(year, month, 0).getDate();

    const getShiftColorClass = (shiftName: string) => {
        const lower = shiftName.toLowerCase();
        if (lower.includes("holiday") || lower === "holiday") return "bg-red-500/10 text-red-600 border-red-500/20";
        if (lower === "off") return "bg-slate-500/10 text-slate-500 border-slate-500/20";
        if (lower.includes("pagi") || lower.includes("morning")) return "bg-blue-500/10 text-blue-600 border-blue-500/20";
        if (lower.includes("siang") || lower.includes("afternoon")) return "bg-amber-500/10 text-amber-600 border-amber-500/20";
        if (lower.includes("malam") || lower.includes("night")) return "bg-purple-500/10 text-purple-600 border-purple-500/20";
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                <CardTitle className="text-lg flex items-center gap-2 mt-0">
                    <CalendarDays className="h-5 w-5 text-indigo-500" />
                    Work Schedule
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
                    <Button variant="outline" size="sm" className="h-8" onClick={handleClear} disabled={generating || schedules.length === 0}>
                        <Trash2 className="w-4 h-4 mr-1" /> Clear
                    </Button>
                    <Button size="sm" className="h-8" onClick={handleGenerate} disabled={generating}>
                        {generating ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1" />}
                        Generate
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
                {loading ? (
                    <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                ) : employeesList.length === 0 ? (
                    <p className="text-center p-8 text-sm text-muted-foreground italic">No schedule generated for this month. Click Generate to create one.</p>
                ) : (
                    <div className="p-4">
                        <table className="w-full text-sm border-collapse min-w-[800px]">
                            <thead>
                                <tr>
                                    <th className="border-b p-2 font-medium text-left sticky left-0 bg-card z-10 w-48 shadow-[1px_0_0_0_#e2e8f0] dark:shadow-[1px_0_0_0_#1e293b]">Employee</th>
                                    {Array.from({ length: daysInMonth }).map((_, i) => (
                                        <th key={i} className="border-b p-2 font-medium text-center text-xs min-w-[40px] text-muted-foreground">
                                            {i + 1}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {employeesList.map(empData => (
                                    <tr key={empData.employee.employeeNumber} className="group hover:bg-muted/30">
                                        <td className="border-b p-2 sticky left-0 bg-card z-10 group-hover:bg-muted/30 shadow-[1px_0_0_0_#e2e8f0] dark:shadow-[1px_0_0_0_#1e293b]">
                                            <div className="font-medium truncate">{empData.employee.fullName}</div>
                                            <div className="text-[10px] text-muted-foreground">{empData.employee.employeeNumber}</div>
                                        </td>
                                        {Array.from({ length: daysInMonth }).map((_, i) => {
                                            const day = i + 1;
                                            const sch = empData.days[day];
                                            if (!sch) return <td key={day} className="border-b p-1 text-center bg-muted/10" />;
                                            
                                            // Make it clickable
                                            return (
                                                <td key={day} className="border-b p-1">
                                                    <div 
                                                        className={`w-full h-full min-h-[36px] flex flex-col items-center justify-center rounded border text-[10px] cursor-pointer hover:opacity-80 transition-opacity ${getShiftColorClass(sch.shiftName)}`}
                                                        title={`${sch.shiftName}: ${sch.scheduledStart} - ${sch.scheduledEnd}`}
                                                        onClick={() => handleOpenOverride(sch)}
                                                    >
                                                        <span className="font-semibold leading-tight px-1 text-center line-clamp-1">{sch.shiftName === "Holiday" ? "Hol" : sch.shiftName === "Off" ? "Off" : sch.shiftName.substring(0, 3)}</span>
                                                        <span className="text-[8px] opacity-70 mt-0.5">{sch.shiftName !== 'Off' && sch.shiftName !== 'Holiday' ? sch.scheduledStart : ''}</span>
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>
            
            <Dialog open={overrideOpen} onOpenChange={setOverrideOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Override Daily Schedule</DialogTitle>
                    </DialogHeader>
                    {selectedSchedule && (
                        <div className="space-y-4 py-3">
                            <p className="text-sm text-muted-foreground mb-2">
                                Modifying {new Date(selectedSchedule.date).toLocaleDateString(undefined, { timeZone: 'UTC' })} for {selectedSchedule.employee?.fullName}
                            </p>
                            <div className="space-y-2">
                                <Label>Shift Name</Label>
                                <Input 
                                    value={overrideData.shiftName} 
                                    onChange={e => setOverrideData({...overrideData, shiftName: e.target.value})}
                                    placeholder="e.g. Off, Holiday, Pagi"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Start Time</Label>
                                    <Input 
                                        type="time" 
                                        value={overrideData.scheduledStart} 
                                        onChange={e => setOverrideData({...overrideData, scheduledStart: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>End Time</Label>
                                    <Input 
                                        type="time" 
                                        value={overrideData.scheduledEnd} 
                                        onChange={e => setOverrideData({...overrideData, scheduledEnd: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOverrideOpen(false)}>Cancel</Button>
                        <Button onClick={saveOverride} disabled={savingOverride}>
                            {savingOverride ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Edit2 className="w-4 h-4 mr-2"/>} Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
