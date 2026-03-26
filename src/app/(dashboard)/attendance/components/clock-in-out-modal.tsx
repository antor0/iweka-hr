"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, TimerReset, Timer } from "lucide-react";

interface ClockInOutModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function ClockInOutModal({ open, onOpenChange, onSuccess }: ClockInOutModalProps) {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isClockingIn, setIsClockingIn] = useState(false);
    const [isClockingOut, setIsClockingOut] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!open) return;
        
        setError(null);
        // We sync local time but technically backend uses request time
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(interval);
    }, [open]);

    const handleClock = async (type: 'in' | 'out') => {
        try {
            setError(null);
            if (type === 'in') setIsClockingIn(true);
            else setIsClockingOut(true);

            const res = await fetch(`/api/v1/attendance/clock-${type}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ time: new Date().toISOString() }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Failed to clock in/out");
            }

            onSuccess();
            onOpenChange(false);
        } catch (err: any) {
            setError(err.message || "An error occurred");
        } finally {
            if (type === 'in') setIsClockingIn(false);
            else setIsClockingOut(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Clock In / Out</DialogTitle>
                    <DialogDescription>
                        Record your attendance for today.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col items-center justify-center space-y-6 py-6 border rounded-md bg-secondary/10">
                    <div className="text-4xl font-mono tracking-tighter">
                        {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                    <div className="text-sm text-muted-foreground">
                        {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                </div>
                
                {error && (
                    <div className="text-sm font-medium text-destructive text-center bg-destructive/10 py-2 px-2 rounded-md">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4 mt-4">
                    <Button 
                        onClick={() => handleClock('in')} 
                        disabled={isClockingIn || isClockingOut}
                        className="w-full"
                    >
                        {isClockingIn ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Timer className="mr-2 h-4 w-4" />}
                        Clock In
                    </Button>
                    <Button 
                        onClick={() => handleClock('out')} 
                        disabled={isClockingIn || isClockingOut}
                        variant="secondary"
                        className="w-full"
                    >
                        {isClockingOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <TimerReset className="mr-2 h-4 w-4" />}
                        Clock Out
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
