'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

type FileData = {
    url: string;
    fileName: string;
    fileSize: number;
    fileType: string;
};

export async function createResource(formData: FormData) {
    const title = formData.get('title') as string;
    const description = formData.get('description') as string | null;
    const type = formData.get('type') as string;
    const classId = formData.get('classId') as string;
    const subjectId = formData.get('subjectId') as string;
    const topicId = formData.get('topicId') as string | null;
    const filesJson = formData.get('files') as string | null;

    if (!title || !type || !classId || !subjectId) {
        return { error: 'Title, type, class, and subject are required' };
    }

    try {
        // Parse files data
        const files: FileData[] = filesJson ? JSON.parse(filesJson) : [];

        const resource = await db.resource.create({
            data: {
                title,
                description: description || null,
                type,
                classId,
                subjectId,
                topicId: topicId || null,
                files: {
                    create: files.map(f => ({
                        url: f.url,
                        fileName: f.fileName,
                        fileSize: f.fileSize,
                        fileType: f.fileType,
                    }))
                }
            },
            include: { class: { include: { students: true } }, subject: true, files: true }
        });

        // Notify Students
        const studentUserIds = resource.class.students.map(s => s.userId);
        if (studentUserIds.length > 0) {
            await db.notification.createMany({
                data: studentUserIds.map(uid => ({
                    userId: uid,
                    message: `New Study Material: ${resource.title} (${resource.subject.name})`
                }))
            });
        }

        revalidatePath('/admin/resources');
        revalidatePath('/admin/curriculum');
        return { success: true, resourceId: resource.id };
    } catch (error) {
        console.error('Create resource error:', error);
        return { error: 'Failed to add resource.' };
    }
}

export async function updateResource(formData: FormData) {
    const id = formData.get('id') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string | null;
    const type = formData.get('type') as string;
    const classId = formData.get('classId') as string;
    const subjectId = formData.get('subjectId') as string;
    const topicId = formData.get('topicId') as string | null;
    const filesJson = formData.get('files') as string | null;

    if (!id || !title || !type || !classId || !subjectId) {
        return { error: 'All required fields must be provided' };
    }

    try {
        // Parse files data
        const files: FileData[] = filesJson ? JSON.parse(filesJson) : [];

        // Delete existing files and add new ones
        await db.resourceFile.deleteMany({
            where: { resourceId: id }
        });

        await db.resource.update({
            where: { id },
            data: {
                title,
                description: description || null,
                type,
                classId,
                subjectId,
                topicId: topicId || null,
                files: {
                    create: files.map(f => ({
                        url: f.url,
                        fileName: f.fileName,
                        fileSize: f.fileSize,
                        fileType: f.fileType,
                    }))
                }
            }
        });

        revalidatePath('/admin/resources');
        revalidatePath('/admin/curriculum');
        return { success: true };
    } catch (error) {
        console.error('Update resource error:', error);
        return { error: 'Failed to update resource.' };
    }
}

export async function deleteResource(id: string) {
    try {
        await db.resource.delete({ where: { id } });
        revalidatePath('/admin/resources');
        return { success: true };
    } catch (error) {
        return { error: 'Failed to delete resource.' };
    }
}

export async function addFileToResource(resourceId: string, file: FileData) {
    try {
        // Check file count
        const existingCount = await db.resourceFile.count({
            where: { resourceId }
        });

        if (existingCount >= 5) {
            return { error: 'Maximum 5 files per resource' };
        }

        await db.resourceFile.create({
            data: {
                resourceId,
                url: file.url,
                fileName: file.fileName,
                fileSize: file.fileSize,
                fileType: file.fileType,
            }
        });

        revalidatePath('/admin/resources');
        return { success: true };
    } catch (error) {
        return { error: 'Failed to add file.' };
    }
}

export async function removeFileFromResource(fileId: string) {
    try {
        await db.resourceFile.delete({ where: { id: fileId } });
        revalidatePath('/admin/resources');
        return { success: true };
    } catch (error) {
        return { error: 'Failed to remove file.' };
    }
}
