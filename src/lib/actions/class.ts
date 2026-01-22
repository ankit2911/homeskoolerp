'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function createClass(formData: FormData) {
    const name = formData.get('name') as string;
    const section = formData.get('section') as string;
    const boardId = formData.get('boardId') as string;
    const subjectIds = formData.getAll('subjectIds') as string[];

    if (!name || !boardId) return { error: 'Name and Board are required' };

    try {
        const newClass = await db.class.create({
            data: {
                name,
                section: section || undefined,
                boardId
            },
        });

        // Create subjects from selected SubjectMaster IDs
        if (subjectIds.length > 0) {
            // Fetch subject masters to get names
            const subjectMasters = await db.subjectMaster.findMany({
                where: { id: { in: subjectIds } }
            });

            await db.subject.createMany({
                data: subjectMasters.map(sm => ({
                    name: sm.name,
                    classId: newClass.id,
                    subjectMasterId: sm.id
                }))
            });
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
    const subjectIds = formData.getAll('subjectIds') as string[];

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

        // Handle subject updates
        const existingSubjects = await db.subject.findMany({
            where: { classId: id }
        });

        const existingSubjectMasterIds = existingSubjects
            .map(s => s.subjectMasterId)
            .filter((id): id is string => id !== null);

        // Determine subjects to add
        const subjectsToAdd = subjectIds.filter(smId => !existingSubjectMasterIds.includes(smId));

        // Determine subjects to remove (only those linked to a SubjectMaster)
        const subjectsToRemove = existingSubjects.filter(s =>
            s.subjectMasterId && !subjectIds.includes(s.subjectMasterId)
        );

        if (subjectsToAdd.length > 0) {
            const subjectMasters = await db.subjectMaster.findMany({
                where: { id: { in: subjectsToAdd } }
            });

            await db.subject.createMany({
                data: subjectMasters.map(sm => ({
                    name: sm.name,
                    classId: id,
                    subjectMasterId: sm.id
                }))
            });
        }

        if (subjectsToRemove.length > 0) {
            await db.subject.deleteMany({
                where: {
                    id: { in: subjectsToRemove.map(s => s.id) }
                }
            });
        }

        revalidatePath('/admin/configuration');
        revalidatePath('/admin/curriculum');
        return { success: true };
    } catch (error) {
        console.error(error);
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
