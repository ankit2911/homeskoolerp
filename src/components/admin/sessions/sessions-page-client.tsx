'use client';

import { useState } from 'react';
import { SessionsView } from '@/components/admin/sessions/session-views';
import { CreateSessionDialog, EditSessionDialog } from '@/components/admin/session-dialogs';
import { BulkSessionDialog } from '@/components/admin/sessions/bulk-session-dialog';
import { SessionLogDialog } from '@/components/admin/sessions/session-log-dialog';
import type { Session, ClassType, TeacherType, AllocationType } from './types';

type BoardType = { id: string; name: string };
type ResourceType = { id: string; title: string; type: string; classId: string; subjectId: string; topicId: string | null };
type StudentType = {
    id: string;
    firstName: string | null;
    lastName: string | null;
    rollNumber: string | null;
    classId: string | null;
};

export function SessionsPageClient({
    sessions,
    boards,
    classes,
    teachers,
    allocations,
    students,
    resources
}: {
    sessions: Session[];
    boards: BoardType[];
    classes: ClassType[];
    teachers: TeacherType[];
    allocations: AllocationType[];
    students: StudentType[];
    resources: ResourceType[];
}) {
    const [editingSession, setEditingSession] = useState<Session | null>(null);
    const [loggingSession, setLoggingSession] = useState<Session | null>(null);

    // Filter students by class when showing log dialog
    const getStudentsForSession = (session: Session) => {
        return students.filter(s => s.classId === session.classId);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Sessions</h1>
                    <p className="text-sm text-muted-foreground">Manage and track classroom sessions</p>
                </div>
                <div className="flex items-center gap-2">
                    <BulkSessionDialog
                        classes={classes}
                        boards={boards}
                        teachers={teachers}
                        allocations={allocations}
                    />
                    <CreateSessionDialog
                        classes={classes}
                        boards={boards}
                        teachers={teachers}
                        allocations={allocations}
                        resources={resources}
                    />
                </div>
            </div>

            <SessionsView
                sessions={sessions}
                classes={classes}
                teachers={teachers}
                onEdit={setEditingSession}
                onAddLog={setLoggingSession}
            />

            {editingSession && (
                <EditSessionDialog
                    classes={classes}
                    boards={boards}
                    teachers={teachers}
                    allocations={allocations}
                    resources={resources}
                    session={editingSession}
                    open={!!editingSession}
                    onOpenChange={(open) => !open && setEditingSession(null)}
                />
            )}

            {loggingSession && (
                <SessionLogDialog
                    open={!!loggingSession}
                    onOpenChange={(open) => !open && setLoggingSession(null)}
                    session={{
                        id: loggingSession.id,
                        title: loggingSession.title,
                        teacherId: loggingSession.teacherId,
                        class: loggingSession.class,
                        subject: loggingSession.subject
                    }}
                    students={getStudentsForSession(loggingSession)}
                />
            )}
        </div>
    );
}
