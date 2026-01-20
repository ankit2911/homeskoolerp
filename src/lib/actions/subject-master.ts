'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function createSubjectMaster(formData: FormData) {
    const name = formData.get('name') as string;
    const code = formData.get('code') as string;
    const category = formData.get('category') as string;

    if (!name || !code) return { error: 'Name and Code are required' };

    try {
        await db.subjectMaster.create({
            data: { name, code, category: category || 'primary' }
        });
        revalidatePath('/admin/configuration');
        return { success: true };
    } catch (error) {
        console.error('Failed to create global subject:', error);
        return { error: 'Failed to create global subject. Code or Name might be duplicate.' };
    }
}

export async function updateSubjectMaster(formData: FormData) {
    const id = formData.get('id') as string;
    const name = formData.get('name') as string;
    const code = formData.get('code') as string;
    const category = formData.get('category') as string;

    if (!id || !name || !code) return { error: 'Missing required fields' };

    try {
        await db.subjectMaster.update({
            where: { id },
            data: { name, code, category }
        });
        revalidatePath('/admin/configuration');
        return { success: true };
    } catch (error) {
        console.error('Failed to update global subject:', error);
        return { error: 'Failed to update global subject' };
    }
}

export async function deleteSubjectMaster(id: string) {
    try {
        await db.subjectMaster.delete({
            where: { id }
        });
        revalidatePath('/admin/configuration');
        return { success: true };
    } catch (error) {
        console.error('Failed to delete global subject:', error);
        return { error: 'Failed to delete global subject' };
    }
}
