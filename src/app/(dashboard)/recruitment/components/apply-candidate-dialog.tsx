"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export function ApplyCandidateDialog({ requisitionId, onSuccess }: { requisitionId: string, onSuccess?: () => void }) {
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [candidates, setCandidates] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const router = useRouter();

    const [formData, setFormData] = useState({
        candidateId: "",
        expectedSalary: "",
        notes: ""
    });

    useEffect(() => {
        if (isOpen) {
            fetchCandidates();
        }
    }, [isOpen]);

    const fetchCandidates = async () => {
        try {
            const res = await fetch('/api/v1/recruitment/candidates');
            const { data } = await res.json();
            setCandidates(data || []);
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
            const res = await fetch('/api/v1/recruitment/applications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requisitionId,
                    candidateId: formData.candidateId,
                    expectedSalary: formData.expectedSalary ? Number(formData.expectedSalary) : undefined,
                    notes: formData.notes
                })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to add candidate");
            }

            toast({ title: "Success", description: "Candidate applied to job successfully" });
            setIsOpen(false);
            setFormData({
                candidateId: "",
                expectedSalary: "",
                notes: ""
            });
            if (onSuccess) onSuccess();
            router.refresh();
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    const filteredCandidates = candidates.filter(c => 
        (c.firstName + ' ' + c.lastName).toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-1.5" /> Add Candidate to Job</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Add Candidate to Job</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Search Candidate</Label>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search by name or email..." 
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="candidateId">Select Candidate</Label>
                        <Select value={formData.candidateId} onValueChange={(v) => setFormData({ ...formData, candidateId: v })} required>
                            <SelectTrigger><SelectValue placeholder="Select a candidate" /></SelectTrigger>
                            <SelectContent className="max-h-[200px]">
                                {filteredCandidates.map(c => (
                                    <SelectItem key={c.id} value={c.id}>
                                        {c.firstName} {c.lastName} ({c.email})
                                    </SelectItem>
                                ))}
                                {filteredCandidates.length === 0 && (
                                    <div className="p-2 text-sm text-muted-foreground text-center">No candidates found</div>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="expectedSalary">Expected Salary (Optional)</Label>
                        <Input id="expectedSalary" name="expectedSalary" type="number" min="0" value={formData.expectedSalary} onChange={handleChange} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea id="notes" name="notes" rows={3} value={formData.notes} onChange={handleChange} />
                    </div>

                    <DialogFooter className="mt-6">
                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={isLoading || !formData.candidateId}>{isLoading ? "Adding..." : "Add to Job"}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
