'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Calendar, CheckCircle2, Clock, AlertTriangle, TrendingUp } from 'lucide-react';
import type { TodayStats } from '@/lib/actions/dashboard';

type TodayOverviewProps = {
    stats: TodayStats;
};

export function TodayOverview({ stats }: TodayOverviewProps) {
    const cards = [
        {
            label: 'Total Sessions',
            value: stats.total,
            icon: Calendar,
            color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
            iconBg: 'bg-blue-500',
            description: 'Scheduled for today'
        },
        {
            label: 'Completed',
            value: stats.completed,
            icon: CheckCircle2,
            color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
            iconBg: 'bg-emerald-500',
            description: 'Sessions finished'
        },
        {
            label: 'In Progress',
            value: stats.inProgress,
            icon: TrendingUp,
            color: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
            iconBg: 'bg-purple-500',
            description: 'Currently running'
        },
        {
            label: 'Upcoming',
            value: stats.upcoming,
            icon: Clock,
            color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
            iconBg: 'bg-amber-500',
            description: 'Sessions remaining'
        },
        {
            label: 'At Risk',
            value: stats.atRisk,
            icon: AlertTriangle,
            color: stats.atRisk > 0
                ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                : 'bg-gray-50 text-gray-400 dark:bg-gray-800/20',
            iconBg: stats.atRisk > 0 ? 'bg-red-500' : 'bg-gray-400',
            description: 'Need attention',
            highlight: stats.atRisk > 0
        }
    ];

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Today&apos;s Operations</h2>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </span>
            </div>
            <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
                {cards.map((card) => (
                    <Card
                        key={card.label}
                        className={`border-0 shadow-sm transition-all hover:shadow-md ${card.highlight ? 'ring-2 ring-red-200 dark:ring-red-800' : ''}`}
                    >
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                                <div className={`p-2 rounded-xl ${card.iconBg}`}>
                                    <card.icon className="w-4 h-4 text-white" strokeWidth={2.5} />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white">{card.value}</h3>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-0.5">{card.label}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
