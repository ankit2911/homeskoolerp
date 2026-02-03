'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

// Session Statuses
export const SESSION_STATUS = {
    SCHEDULED: 'SCHEDULED',
    IN_PROGRESS: 'IN_PROGRESS',
    PENDING_LOG: 'PENDING_LOG',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED'
} as const;

export async function createSession(formData: FormData) {
    const title = formData.get('title') as string;
    const description = formData.get('description') as string || null;
    const startTime = formData.get('startTime') as string;
    const endTime = formData.get('endTime') as string;
    const classId = formData.get('classId') as string;
    const subjectId = formData.get('subjectId') as string;
    const chapterId = formData.get('chapterId') as string || null;
    const topicId = formData.get('topicId') as string || null;
    const teacherId = formData.get('teacherId') as string || null;

    if (!title || !startTime || !endTime || !classId || !subjectId) {
        return { error: 'All required fields are missing' };
    }

    try {
        const session = await db.session.create({
            data: {
                title,
                description,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                classId,
                subjectId,
                chapterId: chapterId || undefined,
                topicId: topicId || undefined,
                teacherId: teacherId || undefined,
                status: SESSION_STATUS.SCHEDULED
            },
            include: {
                class: { include: { students: true } },
                subject: true,
                teacher: true
            }
        });

        // Notify Students
        const studentUserIds = session.class.students.map(s => s.userId);
        if (studentUserIds.length > 0) {
            await db.notification.createMany({
                data: studentUserIds.map(uid => ({
                    userId: uid,
                    message: `New Session Scheduled: ${session.title} (${session.subject.name}) on ${new Date(startTime).toLocaleString()}`
                }))
            });
        }

        revalidatePath('/admin/sessions');
        return { success: true };
    } catch (error) {
        console.error(error);
        return { error: 'Failed to create session.' };
    }
}

export async function updateSession(formData: FormData) {
    const id = formData.get('id') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string || null;
    const startTime = formData.get('startTime') as string;
    const endTime = formData.get('endTime') as string;
    const status = formData.get('status') as string;
    const classId = formData.get('classId') as string;
    const subjectId = formData.get('subjectId') as string;
    const chapterId = formData.get('chapterId') as string || null;
    const topicId = formData.get('topicId') as string || null;
    const teacherId = formData.get('teacherId') as string || null;

    try {
        await db.session.update({
            where: { id },
            data: {
                title,
                description,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                status,
                classId: classId || undefined,
                subjectId: subjectId || undefined,
                chapterId,
                topicId,
                teacherId: teacherId || undefined
            }
        });
        revalidatePath('/admin/sessions');
        return { success: true };
    } catch (error) {
        console.error('Failed to update session:', error);
        return { error: 'Failed to update session.' };
    }
}

export async function deleteSession(id: string) {
    try {
        await db.session.delete({ where: { id } });
        revalidatePath('/admin/sessions');
        return { success: true };
    } catch (error) {
        console.error('Failed to delete session:', error);
        return { error: 'Failed to delete session.' };
    }
}

// Start a session - transitions from SCHEDULED to IN_PROGRESS
export async function startSession(id: string) {
    try {
        const session = await db.session.findUnique({ where: { id } });
        if (!session) {
            return { error: 'Session not found.' };
        }
        if (session.status !== SESSION_STATUS.SCHEDULED) {
            return { error: 'Only scheduled sessions can be started.' };
        }

        await db.session.update({
            where: { id },
            data: { status: SESSION_STATUS.IN_PROGRESS }
        });

        revalidatePath('/admin/sessions');
        return { success: true };
    } catch (error) {
        console.error('Failed to start session:', error);
        return { error: 'Failed to start session.' };
    }
}

// End a session - transitions to PENDING_LOG (requires teacher log before completed)
export async function endSession(id: string) {
    try {
        const session = await db.session.findUnique({ where: { id } });
        if (!session) {
            return { error: 'Session not found.' };
        }
        if (session.status !== SESSION_STATUS.IN_PROGRESS) {
            return { error: 'Only in-progress sessions can be ended.' };
        }

        await db.session.update({
            where: { id },
            data: { status: SESSION_STATUS.PENDING_LOG }
        });

        revalidatePath('/admin/sessions');
        return { success: true };
    } catch (error) {
        console.error('Failed to end session:', error);
        return { error: 'Failed to end session.' };
    }
}

// Submit session log - transitions from PENDING_LOG to COMPLETED
export async function submitSessionLog(formData: FormData) {
    const sessionId = formData.get('sessionId') as string;
    const teacherId = formData.get('teacherId') as string;
    const topicsCovered = formData.get('topicsCovered') as string;
    const homework = formData.get('homework') as string || null;
    const classNotes = formData.get('classNotes') as string || null;
    const challenges = formData.get('challenges') as string || null;
    const nextSteps = formData.get('nextSteps') as string || null;
    const studentNotesJson = formData.get('studentNotes') as string || '[]';

    if (!sessionId || !teacherId || !topicsCovered) {
        return { error: 'Session ID, Teacher ID, and Topics Covered are required.' };
    }

    try {
        // Check if log already exists
        const existingLog = await db.sessionLog.findUnique({
            where: { sessionId }
        });

        let logId: string;

        if (existingLog) {
            // Update existing log
            const updated = await db.sessionLog.update({
                where: { sessionId },
                data: {
                    topicsCovered,
                    homework,
                    classNotes,
                    challenges,
                    nextSteps
                }
            });
            logId = updated.id;
        } else {
            // Create new log
            const created = await db.sessionLog.create({
                data: {
                    sessionId,
                    teacherId,
                    topicsCovered,
                    homework,
                    classNotes,
                    challenges,
                    nextSteps
                }
            });
            logId = created.id;
        }

        // Handle student notes
        const studentNotes: Array<{ studentId: string; note: string; flag?: string }> = JSON.parse(studentNotesJson);
        for (const sn of studentNotes) {
            if (sn.note || sn.flag) {
                await db.studentSessionNote.upsert({
                    where: {
                        sessionLogId_studentId: {
                            sessionLogId: logId,
                            studentId: sn.studentId
                        }
                    },
                    create: {
                        sessionLogId: logId,
                        studentId: sn.studentId,
                        note: sn.note,
                        flag: sn.flag || null
                    },
                    update: {
                        note: sn.note,
                        flag: sn.flag || null
                    }
                });
            }
        }

        // Update session status to COMPLETED
        await db.session.update({
            where: { id: sessionId },
            data: { status: SESSION_STATUS.COMPLETED }
        });

        revalidatePath('/admin/sessions');
        revalidatePath('/teacher/sessions');
        return { success: true };
    } catch (error) {
        console.error('Failed to submit session log:', error);
        return { error: 'Failed to submit session log.' };
    }
}

// Cancel a session
export async function cancelSession(id: string, reason?: string) {
    try {
        const session = await db.session.findUnique({
            where: { id },
            include: {
                class: { include: { students: true } },
                subject: true
            }
        });

        if (!session) {
            return { error: 'Session not found.' };
        }

        if (session.status === SESSION_STATUS.COMPLETED) {
            return { error: 'Cannot cancel a completed session.' };
        }

        await db.session.update({
            where: { id },
            data: {
                status: SESSION_STATUS.CANCELLED,
                description: reason ? `[CANCELLED] ${reason}\n\n${session.description || ''}` : session.description
            }
        });

        // Notify students about cancellation
        const studentUserIds = session.class.students.map(s => s.userId);
        if (studentUserIds.length > 0) {
            await db.notification.createMany({
                data: studentUserIds.map(uid => ({
                    userId: uid,
                    message: `Session Cancelled: ${session.title} (${session.subject.name})${reason ? ` - ${reason}` : ''}`
                }))
            });
        }

        revalidatePath('/admin/sessions');
        return { success: true };
    } catch (error) {
        console.error('Failed to cancel session:', error);
        return { error: 'Failed to cancel session.' };
    }
}

// Get session with log for viewing
export async function getSessionWithLog(sessionId: string) {
    try {
        const session = await db.session.findUnique({
            where: { id: sessionId },
            include: {
                class: { include: { board: true } },
                subject: true,
                chapter: true,
                topic: true,
                teacher: true,
                sessionLog: {
                    include: { teacher: true }
                }
            }
        });
        return session;
    } catch (error) {
        console.error('Failed to get session:', error);
        return null;
    }
}
