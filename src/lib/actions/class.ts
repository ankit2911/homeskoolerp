'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function createClass(formData: FormData) {
    const name = formData.get('name') as string;
    const section = formData.get('section') as string;
    const boardId = formData.get('boardId') as string;
    const subjectsString = formData.get('subjects') as string;

    if (!name || !boardId) return { error: 'Name and Board are required' };

    try {
        const newClass = await db.class.create({
            data: {
                name,
                section: section || undefined,
                boardId
            },
        });

        if (subjectsString) {
            const subjects = subjectsString.split(',').map(s => s.trim()).filter(Boolean);
            if (subjects.length > 0) {
                await db.subject.createMany({
                    data: subjects.map(s => ({
                        name: s,
                        classId: newClass.id
                    }))
                });
            }
        }

        revalidatePath('/admin/configuration');
        revalidatePath('/admin/curriculum');
        return { success: true };
    } catch (error) {
        console.error(error);
        return { error: 'Failed to create class.' };
    }
}


export async function updateClass(formData: FormData) {
    const id = formData.get('id') as string;
    const name = formData.get('name') as string;
    const section = formData.get('section') as string;
    const boardId = formData.get('boardId') as string;

    if (!id || !name || !boardId) return { error: 'ID, Name and Board are required' };

    try {
        await db.class.update({
            where: { id },
            data: {
                name,
                section: section || undefined,
                boardId
            },
        });
        revalidatePath('/admin/configuration');
        revalidatePath('/admin/curriculum');
        return { success: true };
    } catch (error) {
        return { error: 'Failed to update class.' };
    }
}

export async function deleteClass(id: string) {
    try {
        await db.class.delete({ where: { id } });
        revalidatePath('/admin/configuration');
        revalidatePath('/admin/curriculum');
        return { success: true };
    } catch (error) {
        return { error: 'Failed to delete class.' };
    }
}
