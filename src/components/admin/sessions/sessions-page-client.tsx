'use client';

import { useState } from 'react';
import { SessionsView } from '@/components/admin/sessions/session-views';
import { CreateSessionDialog, EditSessionDialog } from '@/components/admin/session-dialogs';

type Session = {
    id: string;
    title: string;
    description: string | null;
    startTime: string | Date;
    endTime: string | Date;
    status: string;
    classId: string;
    subjectId: string;
    chapterId: string | null;
    topicId: string | null;
    teacherId: string | null;
    class: { id: string; name: string; section: string | null; board: { name: string } };
    subject: { id: string; name: string };
    chapter?: { id: string; name: string } | null;
    teacher?: { id: string; firstName: string | null; lastName: string | null } | null;
};

type ClassType = {
    id: string;
    name: string;
    section: string | null;
    board: { name: string };
    subjects: { id: string; name: string; chapters: { id: string; name: string; topics: { id: string; name: string }[] }[] }[];
};

type TeacherType = {
    id: string;
    firstName: string | null;
    lastName: string | null;
    specialization: string | null;
};

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
