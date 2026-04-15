"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export function CreateRequisitionDialog({ onSuccess }: { onSuccess?: () => void }) {
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [departments, setDepartments] = useState<any[]>([]);
    const [positions, setPositions] = useState<any[]>([]);
    const router = useRouter();

    const [formData, setFormData] = useState({
        title: "",
        departmentId: "",
        positionId: "",
        headcount: 1,
        location: "",
        targetDate: "",
        description: "",
        requirements: ""
    });

    useEffect(() => {
        if (isOpen) {
            fetchDepartments();
            fetchPositions();
        }
    }, [isOpen]);

    const fetchDepartments = async () => {
        try {
            const res = await fetch('/api/v1/departments');
            const { data } = await res.json();
            setDepartments(data || []);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchPositions = async () => {
        try {
            const res = await fetch('/api/v1/positions');
            const { data } = await res.json();
            setPositions(data || []);
        } catch (error) {
            console.error(error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await fetch('/api/v1/recruitment/requisitions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    headcount: Number(formData.headcount),
                    targetDate: formData.targetDate ? new Date(formData.targetDate).toISOString() : undefined
                })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to create job posting");
            }

            toast({ title: "Success", description: "Job posting created successfully" });
            setIsOpen(false);
            setFormData({
                title: "",
                departmentId: "",
                positionId: "",
                headcount: 1,
                location: "",
                targetDate: "",
                description: "",
                requirements: ""
            });
            if (onSuccess) onSuccess();
            router.refresh();
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-1.5" /> Create Job Posting</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create New Job Posting</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Job Title</Label>
                            <Input id="title" name="title" required value={formData.title} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="headcount">Headcount</Label>
                            <Input id="headcount" name="headcount" type="number" min="1" required value={formData.headcount} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="departmentId">Department</Label>
                            <Select value={formData.departmentId} onValueChange={(v) => setFormData({ ...formData, departmentId: v })} required>
                                <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                                <SelectContent>
                                    {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="positionId">Position</Label>
                            <Select value={formData.positionId} onValueChange={(v) => setFormData({ ...formData, positionId: v })} required>
                                <SelectTrigger><SelectValue placeholder="Select position" /></SelectTrigger>
                                <SelectContent>
                                    {positions.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="location">Location</Label>
                            <Input id="location" name="location" value={formData.location} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="targetDate">Target Date</Label>
                            <Input id="targetDate" name="targetDate" type="date" value={formData.targetDate} onChange={handleChange} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Job Description</Label>
                        <Textarea id="description" name="description" required rows={4} value={formData.description} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="requirements">Requirements</Label>
                        <Textarea id="requirements" name="requirements" required rows={4} value={formData.requirements} onChange={handleChange} />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={isLoading}>{isLoading ? "Saving..." : "Create Posting"}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
