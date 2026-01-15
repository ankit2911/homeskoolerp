'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function createSubject(formData: FormData) {
    const name = formData.get('name') as string;
    const classId = formData.get('classId') as string;

    if (!name || !classId) return { error: 'Name and Class are required' };

    try {
        await db.subject.create({
            data: { name, classId },
        });
        revalidatePath('/admin/subjects');
        return { success: true };
    } catch (error) {
        return { error: 'Failed to create subject.' };
    }
}

export async function deleteSubject(id: string) {
    try {
        await db.subject.delete({ where: { id } });
        revalidatePath('/admin/subjects');
        return { success: true };
    } catch (error) {
        return { error: 'Failed to delete subject.' };
    }
}
