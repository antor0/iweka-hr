"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export function AddCandidateDialog({ onSuccess }: { onSuccess?: () => void }) {
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        source: "Manual",
        resumeUrl: "",
        portfolioUrl: ""
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await fetch('/api/v1/recruitment/candidates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to create candidate");
            }

            toast({ title: "Success", description: "Candidate created successfully" });
            setIsOpen(false);
            setFormData({
                firstName: "",
                lastName: "",
                email: "",
                phone: "",
                source: "Manual",
                resumeUrl: "",
                portfolioUrl: ""
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
                <Button variant="outline"><Plus className="h-4 w-4 mr-1.5" /> Add New Candidate</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Add New Candidate</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input id="firstName" name="firstName" required value={formData.firstName} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input id="lastName" name="lastName" required value={formData.lastName} onChange={handleChange} />
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" required value={formData.email} onChange={handleChange} />
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="source">Source</Label>
                        <Input id="source" name="source" value={formData.source} onChange={handleChange} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="resumeUrl">Resume URL</Label>
                        <Input id="resumeUrl" name="resumeUrl" type="url" value={formData.resumeUrl} onChange={handleChange} placeholder="https://..." />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="portfolioUrl">Portfolio URL</Label>
                        <Input id="portfolioUrl" name="portfolioUrl" type="url" value={formData.portfolioUrl} onChange={handleChange} placeholder="https://..." />
                    </div>

                    <DialogFooter className="mt-6">
                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={isLoading}>{isLoading ? "Saving..." : "Save Candidate"}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
