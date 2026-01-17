'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function createChapter(formData: FormData) {
    const name = formData.get('name') as string;
    const subjectId = formData.get('subjectId') as string;

    if (!name || !subjectId) return { error: 'Name and Subject are required' };

    try {
        await db.chapter.create({
            data: { name, subjectId },
        });
        revalidatePath('/admin/curriculum');
        return { success: true };
    } catch (error) {
        return { error: 'Failed to create chapter.' };
    }
}

export async function updateChapter(formData: FormData) {
    const id = formData.get('id') as string;
    const name = formData.get('name') as string;

    if (!id || !name) return { error: 'ID and Name are required' };

    try {
        await db.chapter.update({
            where: { id },
            data: { name },
        });
        revalidatePath('/admin/curriculum');
        return { success: true };
    } catch (error) {
        return { error: 'Failed to update chapter.' };
    }
}

export async function deleteChapter(id: string) {
    try {
        await db.chapter.delete({ where: { id } });
        revalidatePath('/admin/curriculum');
        return { success: true };
    } catch (error) {
        return { error: 'Failed to delete chapter.' };
    }
}

export async function createTopic(formData: FormData) {
    const name = formData.get('name') as string;
    const chapterId = formData.get('chapterId') as string;

    if (!name || !chapterId) return { error: 'Name and Chapter are required' };

    try {
        await db.topic.create({
            data: { name, chapterId },
        });
        revalidatePath('/admin/curriculum');
        return { success: true };
    } catch (error) {
        return { error: 'Failed to create topic.' };
    }
}

export async function updateTopic(formData: FormData) {
    const id = formData.get('id') as string;
    const name = formData.get('name') as string;

    if (!id || !name) return { error: 'ID and Name are required' };

    try {
        await db.topic.update({
            where: { id },
            data: { name },
        });
        revalidatePath('/admin/curriculum');
        return { success: true };
    } catch (error) {
        return { error: 'Failed to update topic.' };
    }
}

export async function deleteTopic(id: string) {
    try {
        await db.topic.delete({ where: { id } });
        revalidatePath('/admin/curriculum');
        return { success: true };
    } catch (error) {
        return { error: 'Failed to delete topic.' };
    }
}
