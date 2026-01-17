import { db } from '@/lib/db';
import { deleteSession } from '@/lib/actions/session';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import { DeleteConfirm } from '@/components/admin/delete-confirm';
import { CreateSessionDialog, EditSessionDialog } from '@/components/admin/session-dialogs';

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
        include: {
            class: { include: { board: true } },
            subject: true
        },
        orderBy: { startTime: 'asc' }
    });

    // Fetch hierarchy for the form
    const classesData = await db.class.findMany({
        include: {
            board: true,
            subjects: {
                include: {
                    chapters: {
                        include: { topics: true },
                        orderBy: { name: 'asc' }
                    }
                }
            }
        }
    });

    // Fix serialization for client components
    const classes = JSON.parse(JSON.stringify(classesData));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Session Scheduling</h1>
                <CreateSessionDialog classes={classes} />
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
                            <EditSessionDialog classes={classes} session={session} />
                            <DeleteConfirm onDelete={async () => {
                                'use server';
                                return await deleteSession(session.id);
                            }} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
