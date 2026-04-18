"use client";

import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Settings2, MapPin } from "lucide-react";

interface AttendanceSettingsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AttendanceSettingsModal({ open, onOpenChange }: AttendanceSettingsModalProps) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [requireLocation, setRequireLocation] = useState(false);

    useEffect(() => {
        if (open) {
            fetchSettings();
        }
    }, [open]);

    const fetchSettings = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/v1/attendance/settings");
            if (res.ok) {
                const data = await res.json();
                setRequireLocation(data.requireLocation ?? false);
            }
        } catch (error) {
            console.error("Failed to fetch settings", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch("/api/v1/attendance/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ requireLocation }),
            });

            if (res.ok) {
                toast({ title: "Settings saved successfully" });
                onOpenChange(false);
            } else {
                toast({ title: "Failed to save settings", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "An error occurred details in console", variant: "destructive" });
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Settings2 className="h-5 w-5 text-primary" />
                        Attendance Settings
                    </DialogTitle>
                    <DialogDescription>
                        Configure global attendance policies and behavior.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6 space-y-6">
                    {isLoading ? (
                        <div className="flex justify-center items-center py-4">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5 max-w-[240px]">
                                    <Label className="text-base flex items-center gap-1.5">
                                        <MapPin className="h-4 w-4 text-blue-500" /> Require Mobile Location
                                    </Label>
                                    <p className="text-[13px] text-muted-foreground mt-1 leading-snug">
                                        When enabled, employees must allow GPS tracking to clock in or out via the mobile ESS app.
                                    </p>
                                </div>
                                <Switch
                                    checked={requireLocation}
                                    onCheckedChange={setRequireLocation}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving || isLoading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving || isLoading}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
