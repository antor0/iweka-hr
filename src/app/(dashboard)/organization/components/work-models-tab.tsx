"use client";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Plus, Loader2, Pencil, Trash2, X } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function WorkModelsTab() {
    const [models, setModels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Modal state
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingModel, setEditingModel] = useState<any>(null);

    // Form state for adding
    const initialFormState = {
        name: "",
        type: "REGULAR",
        isActive: true,
        schedules: [
            { shiftName: "General Shift", startTime: "08:00", endTime: "17:00", breakMinutes: 60 }
        ]
    };
    const [addForm, setAddForm] = useState(initialFormState);

    const fetchModels = async () => {
        try {
            const res = await fetch("/api/v1/organization/work-time-models");
            const data = await res.json();
            setModels(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchModels(); }, []);

    const handleAddScheduleRow = (isEdit = false) => {
        const newRow = { shiftName: "", startTime: "08:00", endTime: "17:00", breakMinutes: 60 };
        if (isEdit) {
            setEditingModel({ ...editingModel, schedules: [...editingModel.schedules, newRow] });
        } else {
            setAddForm({ ...addForm, schedules: [...addForm.schedules, newRow] });
        }
    };

    const handleRemoveScheduleRow = (index: number, isEdit = false) => {
        if (isEdit) {
            const newSchedules = [...editingModel.schedules];
            newSchedules.splice(index, 1);
            setEditingModel({ ...editingModel, schedules: newSchedules });
        } else {
            const newSchedules = [...addForm.schedules];
            newSchedules.splice(index, 1);
            setAddForm({ ...addForm, schedules: newSchedules });
        }
    };

    const handleUpdateScheduleRow = (index: number, field: string, value: any, isEdit = false) => {
        if (isEdit) {
            const newSchedules = [...editingModel.schedules];
            newSchedules[index] = { ...newSchedules[index], [field]: field === "breakMinutes" ? parseInt(value) || 0 : value };
            setEditingModel({ ...editingModel, schedules: newSchedules });
        } else {
            const newSchedules = [...addForm.schedules];
            newSchedules[index] = { ...newSchedules[index], [field]: field === "breakMinutes" ? parseInt(value) || 0 : value };
            setAddForm({ ...addForm, schedules: newSchedules });
        }
    };

    const handleSaveModel = async (isEdit = false) => {
        const payload = isEdit ? editingModel : addForm;
        
        if (!payload.name) {
            alert("Name is required");
            return;
        }

        if (payload.schedules.length === 0) {
            alert("At least one schedule is required");
            return;
        }

        setIsSubmitting(true);
        try {
            const url = isEdit 
                ? `/api/v1/organization/work-time-models/${editingModel.id}` 
                : "/api/v1/organization/work-time-models";
            
            const res = await fetch(url, {
                method: isEdit ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.error || "Failed to save model");

            setIsAddModalOpen(false);
            setIsEditModalOpen(false);
            setAddForm(initialFormState);
            setEditingModel(null);
            fetchModels();
        } catch (error: any) {
            alert(`Error: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteModel = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/v1/organization/work-time-models/${id}`, {
                method: "DELETE"
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error || "Failed to delete model");
            fetchModels();
        } catch (error: any) {
            alert(`Error: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold text-foreground">Work Time Models</h3>
                    <p className="text-sm text-muted-foreground">Manage shifts and standard working hours</p>
                </div>
                <Button size="sm" onClick={() => setIsAddModalOpen(true)}><Plus className="w-4 h-4 mr-2" />Add Model</Button>
            </div>

            {loading ? <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {models.map(model => (
                        <Card key={model.id} className="glass">
                            <CardContent className="p-5">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                                            <Clock className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-foreground">{model.name}</h4>
                                            <Badge variant="outline" className="mt-1">{model.type}</Badge>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <div className="flex items-center gap-1">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-7 w-7" 
                                                onClick={() => {
                                                    setEditingModel({
                                                        id: model.id,
                                                        name: model.name,
                                                        type: model.type,
                                                        isActive: model.isActive,
                                                        schedules: model.schedules.map((s: any) => ({ ...s }))
                                                    });
                                                    setIsEditModalOpen(true);
                                                }}
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-7 w-7 text-destructive"
                                                onClick={() => handleDeleteModel(model.id, model.name)}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{model._count?.employees || 0} enrolled</p>
                                    </div>
                                </div>
                                <div className="space-y-2 mt-4 bg-black/20 p-3 rounded-lg border border-white/5">
                                    <h5 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Schedules</h5>
                                    {model.schedules?.map((s: any) => (
                                        <div key={s.id} className="flex justify-between text-sm items-center">
                                            <span className="text-foreground text-xs">{s.shiftName}</span>
                                            <span className="font-mono text-[11px] text-muted-foreground">{s.startTime} - {s.endTime}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {models.length === 0 && <p className="text-sm text-muted-foreground">No work models found.</p>}
                </div>
            )}

            {/* Add Modal */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Add Work Time Model</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Model Name</Label>
                                <Input 
                                    placeholder="e.g. Normal Office" 
                                    value={addForm.name}
                                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Model Type</Label>
                                <select 
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                    value={addForm.type}
                                    onChange={(e) => setAddForm({ ...addForm, type: e.target.value })}
                                >
                                    <option value="REGULAR">REGULAR</option>
                                    <option value="SHIFT_2">SHIFT (2 Shifts)</option>
                                    <option value="SHIFT_3">SHIFT (3 Shifts)</option>
                                    <option value="CUSTOM">CUSTOM</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <Label>Schedules / Shifts</Label>
                                <Button variant="outline" size="sm" onClick={() => handleAddScheduleRow(false)}>
                                    <Plus className="w-3 h-3 mr-1" /> Add Shift
                                </Button>
                            </div>
                            <div className="space-y-3 border rounded-lg p-4 bg-black/10">
                                {addForm.schedules.map((s, idx) => (
                                    <div key={idx} className="grid grid-cols-12 gap-3 items-end">
                                        <div className="col-span-11 grid grid-cols-4 gap-2">
                                            <div className="space-y-1">
                                                <p className="text-[10px] text-muted-foreground uppercase font-semibold">Shift Name</p>
                                                <Input size={1} value={s.shiftName} onChange={(e) => handleUpdateScheduleRow(idx, "shiftName", e.target.value, false)} placeholder="Name" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] text-muted-foreground uppercase font-semibold">Start</p>
                                                <Input type="time" value={s.startTime} onChange={(e) => handleUpdateScheduleRow(idx, "startTime", e.target.value, false)} />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] text-muted-foreground uppercase font-semibold">End</p>
                                                <Input type="time" value={s.endTime} onChange={(e) => handleUpdateScheduleRow(idx, "endTime", e.target.value, false)} />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] text-muted-foreground uppercase font-semibold">Break (m)</p>
                                                <Input type="number" value={s.breakMinutes} onChange={(e) => handleUpdateScheduleRow(idx, "breakMinutes", e.target.value, false)} />
                                            </div>
                                        </div>
                                        <div className="col-span-1 pb-1">
                                            <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => handleRemoveScheduleRow(idx, false)}>
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddModalOpen(false)} disabled={isSubmitting}>Cancel</Button>
                        <Button onClick={() => handleSaveModel(false)} disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Create Model
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Work Time Model</DialogTitle>
                    </DialogHeader>
                    {editingModel && (
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Model Name</Label>
                                    <Input 
                                        value={editingModel.name}
                                        onChange={(e) => setEditingModel({ ...editingModel, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Model Type</Label>
                                    <select 
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                        value={editingModel.type}
                                        onChange={(e) => setEditingModel({ ...editingModel, type: e.target.value })}
                                    >
                                        <option value="REGULAR">REGULAR</option>
                                        <option value="SHIFT_2">SHIFT (2 Shifts)</option>
                                        <option value="SHIFT_3">SHIFT (3 Shifts)</option>
                                        <option value="CUSTOM">CUSTOM</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <Label>Schedules / Shifts</Label>
                                    <Button variant="outline" size="sm" onClick={() => handleAddScheduleRow(true)}>
                                        <Plus className="w-3 h-3 mr-1" /> Add Shift
                                    </Button>
                                </div>
                                <div className="space-y-3 border rounded-lg p-4 bg-black/10">
                                    {editingModel.schedules.map((s: any, idx: number) => (
                                        <div key={idx} className="grid grid-cols-12 gap-3 items-end">
                                            <div className="col-span-11 grid grid-cols-4 gap-2">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">Shift Name</p>
                                                    <Input size={1} value={s.shiftName} onChange={(e) => handleUpdateScheduleRow(idx, "shiftName", e.target.value, true)} placeholder="Name" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">Start</p>
                                                    <Input type="time" value={s.startTime} onChange={(e) => handleUpdateScheduleRow(idx, "startTime", e.target.value, true)} />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">End</p>
                                                    <Input type="time" value={s.endTime} onChange={(e) => handleUpdateScheduleRow(idx, "endTime", e.target.value, true)} />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">Break (m)</p>
                                                    <Input type="number" value={s.breakMinutes} onChange={(e) => handleUpdateScheduleRow(idx, "breakMinutes", e.target.value, true)} />
                                                </div>
                                            </div>
                                            <div className="col-span-1 pb-1">
                                                <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => handleRemoveScheduleRow(idx, true)}>
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditModalOpen(false)} disabled={isSubmitting}>Cancel</Button>
                        <Button onClick={() => handleSaveModel(true)} disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}