'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function createClass(formData: FormData) {
    const name = formData.get('name') as string;
    const section = formData.get('section') as string;
    const boardId = formData.get('boardId') as string;

    if (!name || !boardId) return { error: 'Name and Board are required' };

    try {
        await db.class.create({
            data: {
                name,
                section: section || undefined,
                boardId
            },
        });
        revalidatePath('/admin/classes');
        return { success: true };
    } catch (error) {
        return { error: 'Failed to create class.' };
    }
}

export async function deleteClass(id: string) {
    try {
        await db.class.delete({ where: { id } });
        revalidatePath('/admin/classes');
        return { success: true };
    } catch (error) {
        return { error: 'Failed to delete class.' };
    }
}
