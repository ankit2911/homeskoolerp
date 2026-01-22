'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function createSubject(formData: FormData) {
    const classId = formData.get('classId') as string;
    const subjectMasterIds = formData.getAll('subjectMasterIds') as string[];

    if (!classId) return { error: 'Class is required' };

    try {
        if (subjectMasterIds && subjectMasterIds.length > 0) {
            // Check for existing subjects to avoid duplicates
            const existingSubjects = await db.subject.findMany({
                where: {
                    classId,
                    subjectMasterId: { in: subjectMasterIds }
                },
                select: { subjectMasterId: true }
            });

            const existingIds = existingSubjects.map(s => s.subjectMasterId);
            const newSubjectMasterIds = subjectMasterIds.filter(id => !existingIds.includes(id));

            if (newSubjectMasterIds.length > 0) {
                // Fetch subject masters to get names
                const subjectMasters = await db.subjectMaster.findMany({
                    where: { id: { in: newSubjectMasterIds } }
                });

                await db.subject.createMany({
                    data: subjectMasters.map(sm => ({
                        name: sm.name,
                        classId,
                        subjectMasterId: sm.id
                    })),
                });
            }
        } else {
            return { error: 'At least one subject must be selected' };
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
