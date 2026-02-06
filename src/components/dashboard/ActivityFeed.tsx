'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, Plus, RefreshCw, XCircle, Activity } from 'lucide-react';
import type { ActivityItem } from '@/lib/actions/dashboard';

type ActivityFeedProps = {
    activities: ActivityItem[];
};

const ACTIVITY_CONFIG = {
    SESSION_CREATED: {
        icon: Plus,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50 dark:bg-emerald-900/20'
    },
    SESSION_UPDATED: {
        icon: RefreshCw,
        color: 'text-blue-600',
        bg: 'bg-blue-50 dark:bg-blue-900/20'
    },
    SESSION_CANCELLED: {
        icon: XCircle,
        color: 'text-red-600',
        bg: 'bg-red-50 dark:bg-red-900/20'
    },
    CALENDAR_ADDED: {
        icon: Calendar,
        color: 'text-purple-600',
        bg: 'bg-purple-50 dark:bg-purple-900/20'
    }
};

function formatRelativeTime(date: Date) {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
    return (
        <Card className="border-0 shadow-sm h-full flex flex-col">
            <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                        <Activity className="w-4 h-4 text-gray-400" />
                        Recent Activity
                    </CardTitle>
                    <span className="text-[10px] text-gray-400 font-medium">Last 24 hours</span>
                </div>
            </CardHeader>
            <CardContent className="p-0 flex-1">
                <ScrollArea className="h-[300px]">
                    {activities.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full py-10 text-center text-gray-400">
                            <Activity className="w-10 h-10 mb-2 opacity-30" />
                            <p className="font-medium">No recent activity</p>
                            <p className="text-sm">Changes will appear here</p>
                        </div>
                    ) : (
                        <div className="p-3 space-y-3">
                            {activities.map((activity) => {
                                const config = ACTIVITY_CONFIG[activity.type];
                                const Icon = config.icon;

                                return (
                                    <div
                                        key={activity.id}
                                        className="flex items-start gap-3"
                                    >
                                        <div className={`p-1.5 rounded-lg ${config.bg} shrink-0`}>
                                            <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <h4 className="font-bold text-sm text-gray-900 dark:text-white leading-tight">
                                                    {activity.title}
                                                </h4>
                                                <span className="text-[10px] text-gray-400 shrink-0">
                                                    {formatRelativeTime(activity.timestamp)}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-0.5 truncate">
                                                {activity.description}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
