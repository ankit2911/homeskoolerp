'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function createSession(formData: FormData) {
    const title = formData.get('title') as string;
    const startTime = formData.get('startTime') as string;
    const endTime = formData.get('endTime') as string;
    const classId = formData.get('classId') as string;
    const subjectId = formData.get('subjectId') as string;
    const chapterId = formData.get('chapterId') as string || null;
    const topicId = formData.get('topicId') as string || null;

    if (!title || !startTime || !endTime || !classId || !subjectId) {
        return { error: 'All required fields are missing' };
    }

    try {
        const session = await db.session.create({
            data: {
                title,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                classId,
                subjectId,
                chapterId: chapterId || undefined,
                topicId: topicId || undefined,
                status: 'SCHEDULED'
            },
            include: {
                class: { include: { students: true } },
                subject: true
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
    const startTime = formData.get('startTime') as string;
    const endTime = formData.get('endTime') as string;
    const status = formData.get('status') as string;
    const classId = formData.get('classId') as string;
    const subjectId = formData.get('subjectId') as string;
    const chapterId = formData.get('chapterId') as string || null;
    const topicId = formData.get('topicId') as string || null;

    try {
        await db.session.update({
            where: { id },
            data: {
                title,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                status,
                // Make sure we can update these fields too
                classId: classId || undefined,
                subjectId: subjectId || undefined,
                chapterId, // passing null creates disconnect if nullable
                topicId
            }
        });
        revalidatePath('/admin/sessions');
        return { success: true };
    } catch (error) {
        return { error: 'Failed to update session.' };
    }
}

export async function deleteSession(id: string) {
    try {
        await db.session.delete({ where: { id } });
        revalidatePath('/admin/sessions');
        return { success: true };
    } catch (error) {
        return { error: 'Failed to delete session.' };
    }
}
