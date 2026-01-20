'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';

export async function createTeacher(formData: FormData) {
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    // New granular fields
    const phoneCode = formData.get('phoneCode') as string;
    const phoneNumber = formData.get('phoneNumber') as string;
    const qualification = formData.get('qualification') as string;
    const experience = parseInt(formData.get('experience') as string) || 0;
    const specialization = formData.getAll('specialization').join(', ');
    const classes = formData.getAll('classes').join(', ');
    const previousInstitutions = formData.get('previousInstitutions') as string;
    const licenseNumber = formData.get('licenseNumber') as string;

    if (!firstName || !email || !password) return { error: 'Name, Email and Password are required' };

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        await db.user.create({
            data: {
                name: `${firstName} ${lastName}`.trim(),
                email,
                password: hashedPassword,
                role: 'TEACHER',
                teacherProfile: {
                    create: {
                        firstName,
                        lastName,
                        phoneCode,
                        phoneNumber,
                        qualification,
                        experience,
                        specialization,
                        classes,
                        previousInstitutions,
                        licenseNumber
                    }
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
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;

    // New granular fields
    const phoneCode = formData.get('phoneCode') as string;
    const phoneNumber = formData.get('phoneNumber') as string;
    const qualification = formData.get('qualification') as string;
    const experience = parseInt(formData.get('experience') as string) || 0;
    const specialization = formData.getAll('specialization').join(', ');
    const classes = formData.getAll('classes').join(', ');
    const previousInstitutions = formData.get('previousInstitutions') as string;
    const licenseNumber = formData.get('licenseNumber') as string;

    if (!id || !firstName || !email) return { error: 'ID, Name and Email are required' };

    try {
        await db.user.update({
            where: { id },
            data: {
                name: `${firstName} ${lastName}`.trim(),
                email,
                teacherProfile: {
                    update: {
                        firstName,
                        lastName,
                        phoneCode,
                        phoneNumber,
                        qualification,
                        experience,
                        specialization,
                        classes,
                        previousInstitutions,
                        licenseNumber
                    }
                }
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
