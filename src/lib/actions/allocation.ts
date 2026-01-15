'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function createAllocation(formData: FormData) {
    const teacherId = formData.get('teacherId') as string;
    const classId = formData.get('classId') as string;
    const subjectId = formData.get('subjectId') as string;

    if (!teacherId || !classId || !subjectId) return { error: 'All fields are required' };

    try {
        await db.teacherAllocation.create({
            data: {
                teacherId,
                classId,
                subjectId
            },
        });
        revalidatePath('/admin/allocations');
        return { success: true };
    } catch (error) {
        return { error: 'Failed to assign teacher. Mapping might already exist.' };
    }
}

export async function deleteAllocation(id: string) {
    try {
        await db.teacherAllocation.delete({ where: { id } });
        revalidatePath('/admin/allocations');
        return { success: true };
    } catch (error) {
        return { error: 'Failed to delete allocation.' };
    }
}
