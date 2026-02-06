import { db } from '@/lib/db';

export const studentsService = {
    /**
     * Get all active students (Users with role STUDENT) with full profile
     */
    async getStudentsWithProfiles() {
        return await db.user.findMany({
            where: { role: 'STUDENT' },
            include: {
                studentProfile: {
                    include: {
                        class: { include: { board: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    },

    /**
     * Get student details by ID
     */
    async getStudentById(id: string) {
        return await db.studentProfile.findUnique({
            where: { id },
            include: {
                class: true
            }
        });
    }
};
