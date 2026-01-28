import { db } from '@/lib/db';
import { ConfigurationList } from '@/components/admin/configuration-list';

export default async function ConfigurationPage({
    searchParams
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const params = await searchParams;
    const initialAction = typeof params.action === 'string' ? params.action : undefined;

    const boards = await db.board.findMany({
        include: {
            classes: {
                include: {
                    subjects: {
                        where: {
                            subjectMaster: {
                                isActive: true
                            }
                        }
                    },
                    _count: { select: { students: true } }
                }
            }
        },
        orderBy: { name: 'asc' }
    });

    const subjectMasters = await db.subjectMaster.findMany({
        select: {
            id: true,
            name: true,
            code: true,
            category: true,
            isActive: true
        },
        orderBy: { name: 'asc' }
    });

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">Academic Configuration</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">Manage educational boards, classes, and subjects in a centralized hierarchy.</p>
                </div>
            </div>

            <ConfigurationList
                boards={JSON.parse(JSON.stringify(boards))}
                subjectMasters={JSON.parse(JSON.stringify(subjectMasters))}
                initialAction={initialAction}
            />
        </div>
    );
}
