'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function createSubject(formData: FormData) {
    const name = formData.get('name') as string;
    const classId = formData.get('classId') as string;
    const classIds = formData.getAll('classIds') as string[];

    if (!name) return { error: 'Name is required' };

    try {
        if (classIds && classIds.length > 0) {
            await db.subject.createMany({
                data: classIds.map(id => ({ name, classId: id })),
            });
        } else if (classId) {
            await db.subject.create({
                data: { name, classId },
            });
        } else {
            return { error: 'Class is required' };
        }

        revalidatePath('/admin/configuration');
        revalidatePath('/admin/curriculum');
        return { success: true };
    } catch (error) {
        return { error: 'Failed to create subject.' };
    }
}


export async function updateSubject(formData: FormData) {
    const id = formData.get('id') as string;
    const name = formData.get('name') as string;
    const classId = formData.get('classId') as string;

    if (!id || !name || !classId) return { error: 'ID, Name and Class are required' };

    try {
        await db.subject.update({
            where: { id },
            data: { name, classId },
        });
        revalidatePath('/admin/configuration');
        revalidatePath('/admin/curriculum');
        return { success: true };
    } catch (error) {
        return { error: 'Failed to update subject.' };
    }
}

export async function deleteSubject(id: string) {
    try {
        await db.subject.delete({ where: { id } });
        revalidatePath('/admin/subjects');
        revalidatePath('/admin/configuration');
        return { success: true };
    } catch (error) {
        return { error: 'Failed to delete subject.' };
    }
}
