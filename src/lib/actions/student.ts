'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';

export async function createStudent(formData: FormData) {
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const classId = formData.get('classId') as string;

    if (!name || !email || !password || !classId) return { error: 'All fields are required' };

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        await db.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: 'STUDENT',
                studentProfile: {
                    create: {
                        classId,
                        parentPhone: formData.get('parentPhone') as string
                    }
                }
            },
        });
        revalidatePath('/admin/students');
        return { success: true };
    } catch (error) {
        return { error: 'Failed to create student. Email might already exist.' };
    }
}

export async function deleteStudent(id: string) {
    try {
        await db.user.delete({ where: { id } });
        revalidatePath('/admin/students');
        return { success: true };
    } catch (error) {
        return { error: 'Failed to delete student.' };
    }
}
