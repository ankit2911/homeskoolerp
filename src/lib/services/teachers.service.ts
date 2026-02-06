import { db } from '@/lib/db';

export const teachersService = {
    /**
     * Get all teacher profiles
     */
    async getAllTeachers() {
        return await db.teacherProfile.findMany({
            select: {
                id: true,
                firstName: true,
                lastName: true,
                specialization: true,
                user: { select: { id: true, name: true, email: true } }
            },
            orderBy: { firstName: 'asc' }
        });
    },

    /**
     * Get teachers formatted for dropdowns/filters
     */
    async getTeachersForFilter() {
        return await db.teacherProfile.findMany({
            include: {
                user: { select: { id: true, name: true } }
            },
            orderBy: { user: { name: 'asc' } }
        });
    },

    /**
     * Get all allocations
     */
    async getAllAllocations() {
        return await db.teacherAllocation.findMany({
            select: {
                teacherId: true,
                classId: true,
                subjectId: true
            }
        });
    },

    /**
     * Get allocations with full relations for allocations page
     */
    async getAllocationsWithRelations() {
        return await db.teacherAllocation.findMany({
            include: {
                teacher: {
                    include: { user: true }
                },
                class: { include: { board: true } },
                subject: true
            }
        });
    },

    /**
     * Get teachers with full profile
     */
    async getTeachersWithProfile() {
        return await db.teacherProfile.findMany({
            include: {
                user: true
            }
        });
    }
};
