'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function createResource(formData: FormData) {
    const title = formData.get('title') as string;
    const type = formData.get('type') as string;
    const url = formData.get('url') as string;
    const classId = formData.get('classId') as string;
    const subjectId = formData.get('subjectId') as string;

    if (!title || !type || !url || !classId || !subjectId) {
        return { error: 'All fields are required' };
    }

    try {
        const resource = await db.resource.create({
            data: {
                title,
                type,
                url,
                classId,
                subjectId
            },
            include: { class: { include: { students: true } }, subject: true }
        });

        // Notify Students (Optional, but good for prototype)
        const studentUserIds = resource.class.students.map(s => s.userId);
        if (studentUserIds.length > 0) {
            await db.notification.createMany({
                data: studentUserIds.map(uid => ({
                    userId: uid,
                    message: `New Study Material: ${resource.title} (${resource.subject.name})`
                }))
            });
        }

        revalidatePath('/admin/resources');
        return { success: true };
    } catch (error) {
        return { error: 'Failed to add resource.' };
    }
}


export async function updateResource(formData: FormData) {
    const id = formData.get('id') as string;
    const title = formData.get('title') as string;
    const type = formData.get('type') as string;
    const url = formData.get('url') as string;
    const classId = formData.get('classId') as string;
    const subjectId = formData.get('subjectId') as string;

    if (!id || !title || !type || !url || !classId || !subjectId) {
        return { error: 'All fields are required' };
    }

    try {
        await db.resource.update({
            where: { id },
            data: {
                title,
                type,
                url,
                classId,
                subjectId
            }
        });
        revalidatePath('/admin/resources');
        return { success: true };
    } catch (error) {
        return { error: 'Failed to update resource.' };
    }
}

export async function deleteResource(id: string) {
    try {
        await db.resource.delete({ where: { id } });
        revalidatePath('/admin/resources');
        return { success: true };
    } catch (error) {
        return { error: 'Failed to delete resource.' };
    }
}
