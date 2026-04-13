"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Calendar, Plus, Edit, Trash2, Settings, Loader2, ArrowLeft } from "lucide-react";

export default function HolidaysSettingsPage() {
    const currentYear = new Date().getFullYear();
    const [year, setYear] = useState<number>(currentYear);
    const [holidays, setHolidays] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // Dialog state
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        date: "",
        isNational: true,
        description: "",
    });

    const fetchHolidays = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/v1/settings/holidays?year=${year}`);
            if (res.ok) {
                const json = await res.json();
                setHolidays(json.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHolidays();
    }, [year]);

    const handleOpenDialog = (holiday?: any) => {
        if (holiday) {
            setEditingId(holiday.id);
            setFormData({
                name: holiday.name,
                date: new Date(holiday.date).toISOString().split('T')[0],
                isNational: holiday.isNational,
                description: holiday.description || "",
            });
        } else {
            setEditingId(null);
            setFormData({
                name: "",
                date: "",
                isNational: true,
                description: "",
            });
        }
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name || !formData.date) return alert("Name and Date are required");
        setIsSaving(true);
        
        try {
            const method = editingId ? "PUT" : "POST";
            const url = editingId ? `/api/v1/settings/holidays/${editingId}` : "/api/v1/settings/holidays";
            
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    year: parseInt(formData.date.substring(0, 4))
                }),
            });
            
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to save holiday");
            }
            
            setIsDialogOpen(false);
            fetchHolidays();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this holiday?")) return;
        
        try {
            const res = await fetch(`/api/v1/settings/holidays/${id}`, { method: "DELETE" });
            if (res.ok) {
                fetchHolidays();
            }
        } catch (error) {
            console.error("Failed to delete", error);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
            <Link 
                href="/settings" 
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-2"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Settings
            </Link>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
                        <Settings className="w-6 h-6 text-primary" /> Holiday Settings
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">Configure national and company holidays per year</p>
                </div>
                <div className="flex items-center gap-2">
                    <Input 
                        type="number" 
                        value={year} 
                        onChange={(e) => setYear(parseInt(e.target.value))} 
                        className="w-24 text-center"
                    />
                    <Button onClick={() => handleOpenDialog()}>
                        <Plus className="w-4 h-4 mr-1.5" /> Add Holiday
                    </Button>
                </div>
            </div>

            <Card className="glass">
                <CardHeader className="border-b border-white/5 pb-4">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Calendar className="w-5 h-5 text-emerald-500" /> Holidays for {year}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50">
                                    <th className="py-3 px-4 text-left font-medium text-muted-foreground w-32">Date</th>
                                    <th className="py-3 px-4 text-left font-medium text-muted-foreground">Name</th>
                                    <th className="py-3 px-4 text-left font-medium text-muted-foreground w-32">Type</th>
                                    <th className="py-3 px-4 text-right font-medium text-muted-foreground w-24">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center">
                                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                                        </td>
                                    </tr>
                                ) : holidays.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-12 text-center text-muted-foreground">
                                            No holidays configured for {year}.
                                        </td>
                                    </tr>
                                ) : (
                                    holidays.map((h) => (
                                        <tr key={h.id} className="border-b last:border-b-0 hover:bg-muted/30">
                                            <td className="py-3 px-4 font-mono text-xs">
                                                {new Date(h.date).toLocaleDateString("id-ID", {
                                                    day: "2-digit",
                                                    month: "short",
                                                    year: "numeric"
                                                })}
                                            </td>
                                            <td className="py-3 px-4">{h.name}</td>
                                            <td className="py-3 px-4">
                                                {h.isNational ? (
                                                    <Badge className="bg-red-500/10 text-red-500 border-red-500/20">National</Badge>
                                                ) : (
                                                    <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Company</Badge>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog(h)}>
                                                        <Edit className="w-4 h-4 text-blue-500" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10" onClick={() => handleDelete(h.id)}>
                                                        <Trash2 className="w-4 h-4 text-destructive" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingId ? "Edit Holiday" : "Add New Holiday"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Holiday Name</Label>
                            <Input 
                                placeholder="e.g. Hari Raya Idul Fitri" 
                                value={formData.name} 
                                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Date</Label>
                            <Input 
                                type="date" 
                                value={formData.date} 
                                onChange={(e) => setFormData({...formData, date: e.target.value})} 
                            />
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="space-y-0.5">
                                <Label>National Holiday</Label>
                                <p className="text-xs text-muted-foreground">Applies to all regular schedules</p>
                            </div>
                            <Switch 
                                checked={formData.isNational} 
                                onCheckedChange={(c: boolean) => setFormData({...formData, isNational: c})}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Description (Optional)</Label>
                            <Input 
                                value={formData.description} 
                                onChange={(e) => setFormData({...formData, description: e.target.value})} 
                                placeholder="Details about this holiday"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>Cancel</Button>
                        <Button onClick={handleSave} disabled={isSaving || !formData.name || !formData.date}>
                            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
