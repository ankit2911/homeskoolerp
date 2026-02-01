import { db } from '@/lib/db';
import { AllocationsClient } from '@/components/admin/allocations-client';

export const dynamic = 'force-dynamic';

export default async function AllocationsPage() {
    // Fetch boards with classes and subjects
    const boardsData = await db.board.findMany({
        include: {
            classes: {
                orderBy: { name: 'asc' },
                include: {
                    subjects: {
                        where: {
                            subjectMaster: {
                                isActive: true
                            }
                        },
                        orderBy: { name: 'asc' }
                    }
                }
            }
        },
        orderBy: { name: 'asc' }
    });

    // Fetch all teachers with detailed profile
    const teachersData = await db.teacherProfile.findMany({
        include: {
            user: true
        }
    });

    // Fetch all allocations
    const allocationsData = await db.teacherAllocation.findMany({
        include: {
            teacher: {
                include: { user: true }
            },
            class: { include: { board: true } },
            subject: true
        }
    });

    // Serialize for client
    const boards = JSON.parse(JSON.stringify(boardsData));
    const teachers = JSON.parse(JSON.stringify(teachersData));
    const allocations = JSON.parse(JSON.stringify(allocationsData));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">Teacher Allocations</h1>
                    <p className="text-sm text-muted-foreground mt-1">Assign teachers to classes and subjects across your curriculum</p>
                </div>
            </div>
            <AllocationsClient boards={boards} teachers={teachers} allocations={allocations} />
        </div>
    );
}
