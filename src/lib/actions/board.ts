'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function createBoard(formData: FormData) {
    const name = formData.get('name') as string;

    if (!name) return { error: 'Name is required' };

    try {
        await db.board.create({
            data: { name },
        });
        revalidatePath('/admin/configuration');
        return { success: true };
    } catch (error) {
        return { error: 'Failed to create board. It might already exist.' };
    }
}


export async function updateBoard(formData: FormData) {
    const id = formData.get('id') as string;
    const name = formData.get('name') as string;

    if (!id || !name) return { error: 'ID and Name are required' };

    try {
        await db.board.update({
            where: { id },
            data: { name },
        });
        revalidatePath('/admin/configuration');
        return { success: true };
    } catch (error) {
        return { error: 'Failed to update board.' };
    }
}

export async function deleteBoard(id: string) {
    try {
        await db.board.delete({ where: { id } });
        revalidatePath('/admin/configuration');
        return { success: true };
    } catch (error) {
        return { error: 'Failed to delete board.' };
    }
}
