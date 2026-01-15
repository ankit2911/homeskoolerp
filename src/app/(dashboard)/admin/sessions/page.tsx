import { db } from '@/lib/db';
import { createSession, updateSession, deleteSession } from '@/lib/actions/session';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Edit2 } from 'lucide-react';

function getStatusColor(status: string) {
    switch (status) {
        case 'SCHEDULED': return 'bg-blue-500';
        case 'COMPLETED': return 'bg-green-500';
        case 'CANCELLED': return 'bg-red-500';
        default: return 'bg-gray-500';
    }
}

export default async function SessionsPage() {
    const sessions = await db.session.findMany({
        include: { class: { include: { board: true } }, subject: true },
        orderBy: { startTime: 'asc' }
    });

    const classes = await db.class.findMany({
        include: { board: true, subjects: true }
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Session Scheduling</h1>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button><Calendar className="mr-2 h-4 w-4" /> Schedule Session</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Schedule New Session</DialogTitle>
                            <DialogDescription>Create a new classroom session.</DialogDescription>
                        </DialogHeader>
                        <form action={async (formData) => {
                            'use server';
                            // Handle combined Class|Subject input if we were to filter dynamically, 
                            // but for simplicity let's use a flat list of subjects mapped to classes manually or just simpler Selects.
                            // Actually, to ensure valid Class-Subject pair, we should pick Class first then Subject. 
                            // Since this is a server component, we need client-side state for dependent dropdowns.
                            // For this prototype, I'll list all valid Subjects with their Class in one dropdown.

                            const combined = formData.get('subjectCombined') as string;
                            if (combined) {
                                const [subjectId, classId] = combined.split('|');
                                formData.set('subjectId', subjectId);
                                formData.set('classId', classId);
                            }
                            await createSession(formData);
                        }}>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label>Title</Label>
                                    <Input name="title" placeholder="e.g. Algebra Chapter 1" required />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Class - Subject</Label>
                                    <Select name="subjectCombined" required>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Class & Subject" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {classes.flatMap(c => c.subjects.map(s => (
                                                <SelectItem key={`${c.id}-${s.id}`} value={`${s.id}|${c.id}`}>
                                                    {c.name} ({c.board.name}) - {s.name}
                                                </SelectItem>
                                            )))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Start Time</Label>
                                        <Input name="startTime" type="datetime-local" required />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>End Time</Label>
                                        <Input name="endTime" type="datetime-local" required />
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit">Schedule</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                {sessions.length === 0 && <div className="col-span-full text-center text-muted-foreground p-10">No sessions scheduled.</div>}
                {sessions.map((session) => (
                    <div key={session.id} className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="font-semibold text-lg">{session.title}</div>
                            <Badge className={getStatusColor(session.status)}>{session.status}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            {session.class.name} ({session.class.board.name}) • {session.subject.name}
                        </div>
                        <div className="flex items-center text-sm">
                            <Clock className="mr-2 h-4 w-4" />
                            {new Date(session.startTime).toLocaleString()} - {new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>

                        <div className="pt-2 flex gap-2">
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="w-full">Edit</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Edit Session</DialogTitle>
                                    </DialogHeader>
                                    <form action={async (formData) => {
                                        'use server';
                                        await updateSession(formData);
                                    }}>
                                        <input type="hidden" name="id" value={session.id} />
                                        <div className="grid gap-4 py-4">
                                            <div className="grid gap-2">
                                                <Label>Title</Label>
                                                <Input name="title" defaultValue={session.title} required />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="grid gap-2">
                                                    <Label>Start Time</Label>
                                                // Convert to ISO string slice for datetime-local input
                                                    <Input name="startTime" type="datetime-local" defaultValue={new Date(session.startTime).toISOString().slice(0, 16)} required />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label>End Time</Label>
                                                    <Input name="endTime" type="datetime-local" defaultValue={new Date(session.endTime).toISOString().slice(0, 16)} required />
                                                </div>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Status</Label>
                                                <Select name="status" defaultValue={session.status}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                                                        <SelectItem value="COMPLETED">Completed</SelectItem>
                                                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button type="submit">Update</Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                            <form action={async () => {
                                'use server';
                                await deleteSession(session.id);
                            }} className="w-full">
                                <Button variant="destructive" size="sm" className="w-full">Cancel</Button>
                            </form>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
