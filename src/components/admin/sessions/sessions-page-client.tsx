'use client';

import { useState } from 'react';
import { SessionsView } from '@/components/admin/sessions/session-views';
import { CreateSessionDialog, EditSessionDialog } from '@/components/admin/session-dialogs';
import type { Session, ClassType, TeacherType } from './types';



export function SessionsPageClient({
    sessions,
    classes,
    teachers
}: {
    sessions: Session[];
    classes: ClassType[];
    teachers: TeacherType[];
}) {
    const [editingSession, setEditingSession] = useState<Session | null>(null);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Sessions</h1>
                    <p className="text-sm text-muted-foreground">Manage and track classroom sessions</p>
                </div>
                <CreateSessionDialog classes={classes} teachers={teachers} />
            </div>

            <SessionsView
                sessions={sessions}
                classes={classes}
                teachers={teachers}
                onEdit={setEditingSession}
            />

            {editingSession && (
                <EditSessionDialog
                    classes={classes}
                    teachers={teachers}
                    session={editingSession}
                    open={!!editingSession}
                    onOpenChange={(open) => !open && setEditingSession(null)}
                />
            )}
        </div>
    );
}
