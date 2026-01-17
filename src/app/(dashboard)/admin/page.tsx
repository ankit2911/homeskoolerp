import { auth } from '@/auth';
import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BookOpen, GraduationCap, Calendar, Settings } from 'lucide-react';

export default async function AdminDashboard() {
    const session = await auth();

    const stats = [
        {
            label: 'Total Students',
            value: await db.user.count({ where: { role: 'STUDENT' } }),
            icon: GraduationCap,
            color: 'text-blue-600'
        },
        {
            label: 'Total Teachers',
            value: await db.user.count({ where: { role: 'TEACHER' } }),
            icon: Users,
            color: 'text-green-600'
        },
        {
            label: 'Boards',
            value: await db.board.count(),
            icon: Settings,
            color: 'text-purple-600'
        },
        {
            label: 'Active Classes',
            value: await db.class.count(),
            icon: BookOpen,
            color: 'text-orange-600'
        },
        {
            label: 'Sessions Today',
            value: await db.session.count({
                where: {
                    startTime: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0)),
                        lt: new Date(new Date().setHours(23, 59, 59, 999))
                    }
                }
            }),
            icon: Calendar,
            color: 'text-pink-600'
        }
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
            <p className="text-muted-foreground">Welcome back, {session?.user?.name}</p>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {stats.map((stat) => (
                    <Card key={stat.label}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {stat.label}
                            </CardTitle>
                            <stat.icon className={`h-4 w-4 ${stat.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
