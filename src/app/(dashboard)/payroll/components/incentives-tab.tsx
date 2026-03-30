"use client";

import { useState, useEffect } from "react";
import { formatIDR } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Pencil, Trash2, Edit, Loader2 } from "lucide-react";

export function IncentivesTab() {
    const [incentives, setIncentives] = useState([] as any[]);
    const [employees, setEmployees] = useState([] as any[]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    // Form State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        employeeId: "",
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        incentive: 0,
        bonus: 0,
        notes: ""
    });

    const fetchIncentives = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/v1/payroll/incentives");
            const data = await res.json();
            if (data.success) {
                setIncentives(data.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const res = await fetch("/api/v1/employees?limit=100");
            const data = await res.json();
            if (data?.data) {
                setEmployees(data.data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchIncentives();
        fetchEmployees();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === "incentive" || name === "bonus" ? Number(value) : value
        }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [name]: name === "month" || name === "year" ? Number(value) : value
        }));
    };

    const openCreateModal = () => {
        setEditingId(null);
        setFormData({
            employeeId: "",
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
            incentive: 0,
            bonus: 0,
            notes: ""
        });
        setIsAddModalOpen(true);
    };

    const openEditModal = (item: any) => {
        setEditingId(item.id);
        setFormData({
            employeeId: item.employeeId,
            month: item.month,
            year: item.year,
            incentive: Number(item.incentive),
            bonus: Number(item.bonus),
            notes: item.notes || ""
        });
        setIsAddModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const isEdit = !!editingId;
            const url = isEdit ? `/api/v1/payroll/incentives/${editingId}` : "/api/v1/payroll/incentives";
            const method = isEdit ? "PUT" : "POST";
            
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            
            if (data.success) {
                setIsAddModalOpen(false);
                fetchIncentives();
            } else {
                alert(data.error || "Failed to save incentive");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const deleteIncentive = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete incentive for ${name}?`)) return;
        try {
            const res = await fetch(`/api/v1/payroll/incentives/${id}`, { method: 'DELETE' });
            if (res.ok) fetchIncentives();
        } catch (e) {
            console.error(e);
        }
    };

    const monthNames = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    return (
        <Card className="animate-fade-in border-sidebar-border bg-sidebar shadow-md">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
                <div>
                    <CardTitle className="text-xl">Monthly Incentives & Bonuses</CardTitle>
                    <CardDescription className="mt-1">Manage extra compensation for employees across different months.</CardDescription>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="hidden sm:flex">
                        <Search className="h-4 w-4 mr-1.5" /> Filter
                    </Button>
                    <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={openCreateModal}>
                                <Plus className="h-4 w-4 mr-1.5" /> Add New
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>{editingId ? "Edit" : "Add"} Incentive</DialogTitle>
                                <DialogDescription>
                                    Fill in the details for the employee's monthly incentive and bonus.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="employeeId">Employee</Label>
                                    <Select 
                                        disabled={!!editingId} 
                                        value={formData.employeeId} 
                                        onValueChange={(val) => handleSelectChange("employeeId", val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select employee" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {employees.map((emp) => (
                                                <SelectItem key={emp.id} value={emp.id}>
                                                    {emp.fullName} ({emp.employeeNumber})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="month">Month</Label>
                                        <Select 
                                            disabled={!!editingId} 
                                            value={formData.month.toString()} 
                                            onValueChange={(val) => handleSelectChange("month", val)}
                                        >
                                            <SelectTrigger><SelectValue placeholder="Month" /></SelectTrigger>
                                            <SelectContent>
                                                {monthNames.map((m, i) => i > 0 && <SelectItem key={i} value={i.toString()}>{m}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="year">Year</Label>
                                        <Input 
                                            disabled={!!editingId} 
                                            id="year" 
                                            name="year" 
                                            type="number" 
                                            value={formData.year} 
                                            onChange={handleChange} 
                                            required 
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="incentive">Incentive Amount (IDR)</Label>
                                    <Input id="incentive" name="incentive" type="number" min="0" value={formData.incentive} onChange={handleChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bonus">Bonus Amount (IDR)</Label>
                                    <Input id="bonus" name="bonus" type="number" min="0" value={formData.bonus} onChange={handleChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="notes">Notes</Label>
                                    <Input id="notes" name="notes" placeholder="Optional notes" value={formData.notes} onChange={handleChange} />
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                                    <Button type="submit" disabled={isSaving || !formData.employeeId}>
                                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Save Changes
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {loading ? (
                    <div className="p-8 text-center text-muted-foreground animate-pulse">Loading data...</div>
                ) : incentives.length === 0 ? (
                    <div className="p-12 flex flex-col items-center justify-center text-center">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                            <Plus className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold mb-1">No incentives yet</h3>
                        <p className="text-sm text-muted-foreground max-w-sm ml-auto mr-auto">
                            You haven't added any incentives or bonuses for your employees yet. Click "Add New" to get started.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border bg-secondary/20">
                                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">Employee</th>
                                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">Period</th>
                                    <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">Incentive</th>
                                    <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">Bonus</th>
                                    <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {incentives.map((item, i) => (
                                    <tr key={item.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-foreground">{item.employee.fullName}</span>
                                                <span className="text-xs text-muted-foreground">{item.employee.employeeNumber} &bull; {item.employee.position?.title || 'No Position'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium">
                                            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                                                {monthNames[item.month]} {item.year}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="text-sm font-mono font-medium text-success">{formatIDR(item.incentive)}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="text-sm font-mono font-medium text-primary">{formatIDR(item.bonus)}</div>
                                            {item.notes && <p className="text-[10px] text-muted-foreground mt-1 truncate max-w-[120px] ml-auto">{item.notes}</p>}
                                        </td>
                                        <td className="px-6 py-4 flex items-center justify-center gap-2">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => openEditModal(item)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteIncentive(item.id, item.employee.fullName)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
