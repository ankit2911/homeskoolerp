'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Calendar, Edit2 } from 'lucide-react';
import { SessionForm } from './session-form';

export function CreateSessionDialog({ classes }: { classes: any[] }) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button><Calendar className="mr-2 h-4 w-4" /> Schedule Session</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Schedule New Session</DialogTitle>
                    <DialogDescription>Create a new classroom session.</DialogDescription>
                </DialogHeader>
                <SessionForm
                    classes={classes}
                    onClose={() => setOpen(false)}
                />
            </DialogContent>
        </Dialog>
    );
}

export function EditSessionDialog({ classes, session }: { classes: any[]; session: any }) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">Edit</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Edit Session</DialogTitle>
                </DialogHeader>
                <SessionForm
                    classes={classes}
                    session={session}
                    onClose={() => setOpen(false)}
                />
            </DialogContent>
        </Dialog>
    );
}
