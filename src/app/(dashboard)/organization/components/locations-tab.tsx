"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { MapPin, Plus, Loader2, Trash2, Pencil } from "lucide-react";

export function LocationsTab() {
    const [locations, setLocations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [formData, setFormData] = useState({ name: "", address: "", city: "" });
    const [editingLoc, setEditingLoc] = useState<any | null>(null);

    const fetchLocations = async () => {
        try {
            const res = await fetch("/api/v1/organization/locations");
            const data = await res.json();
            setLocations(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchLocations(); }, []);

    const handleSave = async () => {
        setLoading(true);
        try {
            await fetch("/api/v1/organization/locations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...formData, isActive: true })
            });
            setIsAddOpen(false);
            setFormData({ name: "", address: "", city: "" });
            fetchLocations();
        } catch (e) {
            console.error(e);
            alert("Failed to save location");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        if (!editingLoc) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/v1/organization/locations/${editingLoc.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: editingLoc.name,
                    city: editingLoc.city,
                    address: editingLoc.address,
                    isActive: editingLoc.isActive ?? true
                })
            });
            if (!res.ok) throw new Error("Failed to update");
            setIsEditOpen(false);
            setEditingLoc(null);
            fetchLocations();
        } catch (e) {
            console.error(e);
            alert("Failed to update location");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete location "${name}"?`)) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/v1/organization/locations/${id}`, {
                method: "DELETE"
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to delete");
            }
            fetchLocations();
        } catch (e: any) {
            console.error(e);
            alert(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold text-foreground">Company Locations</h3>
                    <p className="text-sm text-muted-foreground">Manage physical office branches and locations</p>
                </div>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm"><Plus className="w-4 h-4 mr-2" />Add Location</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Add New Location</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Location Name</Label>
                                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="HQ Jakarta" />
                            </div>
                            <div className="space-y-2">
                                <Label>City</Label>
                                <Input value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} placeholder="Jakarta" />
                            </div>
                            <div className="space-y-2">
                                <Label>Address</Label>
                                <Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Full address" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                            <Button onClick={handleSave}>Save</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {locations.map(loc => (
                        <Card key={loc.id} className="glass glass-hover overflow-hidden relative group">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <CardContent className="p-5 relative z-10">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                            <MapPin className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-foreground">{loc.name}</h4>
                                            <p className="text-xs text-muted-foreground">{loc.city}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => {
                                                setEditingLoc(loc);
                                                setIsEditOpen(true);
                                            }}
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => handleDelete(loc.id, loc.name)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-white/5 text-xs text-muted-foreground flex justify-between">
                                    <span>{loc._count?.employees || 0} Employees</span>
                                    <span>{loc._count?.departments || 0} Departments</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {locations.length === 0 && <p className="text-sm text-muted-foreground col-span-3">No locations found. Add one to get started.</p>}
                </div>
            )}

            {/* Edit Location Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Edit Location</DialogTitle></DialogHeader>
                    {editingLoc && (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Location Name</Label>
                                <Input 
                                    value={editingLoc.name} 
                                    onChange={e => setEditingLoc({...editingLoc, name: e.target.value})} 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>City</Label>
                                <Input 
                                    value={editingLoc.city} 
                                    onChange={e => setEditingLoc({...editingLoc, city: e.target.value})} 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Address</Label>
                                <Input 
                                    value={editingLoc.address} 
                                    onChange={e => setEditingLoc({...editingLoc, address: e.target.value})} 
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpdate}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}