'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';

export async function createStudent(formData: FormData) {
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const classId = formData.get('classId') as string;
    const subjectIds = formData.getAll('subjectIds') as string[];

    const rollNumber = formData.get('rollNumber') as string;
    const dateOfBirth = formData.get('dateOfBirth') ? new Date(formData.get('dateOfBirth') as string) : null;
    const gender = formData.get('gender') as string;
    const fatherName = formData.get('fatherName') as string;
    const motherName = formData.get('motherName') as string;
    const emergencyContact = formData.get('emergencyContact') as string;
    const parentPhone = formData.get('parentPhone') as string;
    const studentEmail = formData.get('studentEmail') as string;
    const studentPhone = formData.get('studentPhone') as string;
    const alternateEmail = formData.get('alternateEmail') as string;
    const alternatePhone = formData.get('alternatePhone') as string;
    const address = formData.get('address') as string;
    const previousSchool = formData.get('previousSchool') as string;
    const academicYear = (formData.get('academicYear') as string) || '2025-26';
    const status = (formData.get('status') as string) || 'ACTIVE';
    const adminComments = formData.get('adminComments') as string;

    if (!firstName || !email || !password || !classId) return { error: 'Required fields are missing' };

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await db.user.create({
            data: {
                name: `${firstName} ${lastName}`.trim(),
                email,
                password: hashedPassword,
                role: 'STUDENT',
                studentProfile: {
                    create: {
                        firstName,
                        lastName,
                        rollNumber,
                        dateOfBirth,
                        gender,
                        fatherName,
                        motherName,
                        emergencyContact,
                        parentPhone,
                        studentEmail,
                        studentPhone,
                        alternateEmail,
                        alternatePhone,
                        address,
                        previousSchool,
                        academicYear,
                        classId,
                        status,
                        adminComments
                    }
                }
            },
            include: { studentProfile: true }
        });

        // Create subject enrollments
        if (user.studentProfile && subjectIds.length > 0) {
            await db.studentSubject.createMany({
                data: subjectIds.map(subjectId => ({
                    studentId: user.studentProfile!.id,
                    subjectId
                }))
            });
        }

        revalidatePath('/admin/students');
        return { success: true };
    } catch (error) {
        console.error('Failed to create student:', error);
        return { error: 'Failed to create student. Email or Roll Number might already exist.' };
    }
}


export async function updateStudent(formData: FormData) {
    const id = formData.get('id') as string;
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;
    const classId = formData.get('classId') as string;
    const subjectIds = formData.getAll('subjectIds') as string[];

    const rollNumber = formData.get('rollNumber') as string;
    const dateOfBirth = formData.get('dateOfBirth') ? new Date(formData.get('dateOfBirth') as string) : null;
    const gender = formData.get('gender') as string;
    const fatherName = formData.get('fatherName') as string;
    const motherName = formData.get('motherName') as string;
    const emergencyContact = formData.get('emergencyContact') as string;
    const parentPhone = formData.get('parentPhone') as string;
    const studentEmail = formData.get('studentEmail') as string;
    const studentPhone = formData.get('studentPhone') as string;
    const alternateEmail = formData.get('alternateEmail') as string;
    const alternatePhone = formData.get('alternatePhone') as string;
    const address = formData.get('address') as string;
    const previousSchool = formData.get('previousSchool') as string;
    const academicYear = (formData.get('academicYear') as string) || '2025-26';
    const status = (formData.get('status') as string) || 'ACTIVE';
    const adminComments = formData.get('adminComments') as string;

    if (!id || !firstName || !email || !classId) return { error: 'ID, Name, Email, and Class are required' };

    try {
        const user = await db.user.update({
            where: { id },
            data: {
                name: `${firstName} ${lastName}`.trim(),
                email,
                studentProfile: {
                    update: {
                        firstName,
                        lastName,
                        rollNumber,
                        dateOfBirth,
                        gender,
                        fatherName,
                        motherName,
                        emergencyContact,
                        parentPhone,
                        studentEmail,
                        studentPhone,
                        alternateEmail,
                        alternatePhone,
                        address,
                        previousSchool,
                        academicYear,
                        classId,
                        status,
                        adminComments
                    }
                }
            },
            include: { studentProfile: true }
        });

        // Update subject enrollments
        if (user.studentProfile) {
            // Delete existing enrollments
            await db.studentSubject.deleteMany({
                where: { studentId: user.studentProfile.id }
            });

            // Create new enrollments
            if (subjectIds.length > 0) {
                await db.studentSubject.createMany({
                    data: subjectIds.map(subjectId => ({
                        studentId: user.studentProfile!.id,
                        subjectId
                    }))
                });
            }
        }

        revalidatePath('/admin/students');
        redirect('/admin/students');
    } catch (error) {
        console.error('Failed to update student:', error);
        return { error: 'Failed to update student.' };
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
