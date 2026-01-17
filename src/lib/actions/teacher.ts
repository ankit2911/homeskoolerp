'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';

export async function createTeacher(formData: FormData) {
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!name || !email || !password) return { error: 'All fields are required' };

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        await db.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: 'TEACHER',
                teacherProfile: {
                    create: {}
                }
            },
        });
        revalidatePath('/admin/teachers');
        return { success: true };
    } catch (error) {
        return { error: 'Failed to create teacher. Email might already exist.' };
    }
}


export async function updateTeacher(formData: FormData) {
    const id = formData.get('id') as string;
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;

    if (!id || !name || !email) return { error: 'ID, Name and Email are required' };

    try {
        await db.user.update({
            where: { id },
            data: {
                name,
                email
            },
        });
        revalidatePath('/admin/teachers');
        return { success: true };
    } catch (error) {
        return { error: 'Failed to update teacher.' };
    }
}

export async function deleteTeacher(id: string) {
    try {
        await db.user.delete({ where: { id } });
        revalidatePath('/admin/teachers');
        return { success: true };
    } catch (error) {
        return { error: 'Failed to delete teacher.' };
    }
}
