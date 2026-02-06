'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, AlertTriangle, Info, Clock, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { OperationalFlag } from '@/lib/actions/dashboard';

type FlagsAlertsProps = {
    flags: OperationalFlag[];
};

const SEVERITY_CONFIG = {
    critical: {
        icon: AlertCircle,
        color: 'text-red-600',
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-800',
        badge: 'bg-red-100 text-red-700 border-red-200'
    },
    warning: {
        icon: AlertTriangle,
        color: 'text-amber-600',
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        border: 'border-amber-200 dark:border-amber-800',
        badge: 'bg-amber-100 text-amber-700 border-amber-200'
    },
    info: {
        icon: Info,
        color: 'text-blue-600',
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-200 dark:border-blue-800',
        badge: 'bg-blue-100 text-blue-700 border-blue-200'
    }
};

function formatTime(date?: Date) {
    if (!date) return null;
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function FlagsAlerts({ flags }: FlagsAlertsProps) {
    const criticalCount = flags.filter(f => f.severity === 'critical').length;
    const warningCount = flags.filter(f => f.severity === 'warning').length;
    const infoCount = flags.filter(f => f.severity === 'info').length;

    return (
        <Card className="border-0 shadow-sm h-full flex flex-col">
            <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold">Flags & Alerts</CardTitle>
                    <div className="flex gap-1.5">
                        {criticalCount > 0 && (
                            <Badge variant="outline" className="text-[10px] h-5 bg-red-50 text-red-600 border-red-200">
                                {criticalCount} Critical
                            </Badge>
                        )}
                        {warningCount > 0 && (
                            <Badge variant="outline" className="text-[10px] h-5 bg-amber-50 text-amber-600 border-amber-200">
                                {warningCount} Warning
                            </Badge>
                        )}
                        {infoCount > 0 && (
                            <Badge variant="outline" className="text-[10px] h-5 bg-blue-50 text-blue-600 border-blue-200">
                                {infoCount} Info
                            </Badge>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0 flex-1">
                <ScrollArea className="h-[300px]">
                    {flags.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full py-10 text-center text-gray-400">
                            <AlertCircle className="w-10 h-10 mb-2 opacity-30" />
                            <p className="font-medium">All clear!</p>
                            <p className="text-sm">No issues detected today</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                            {flags.map((flag) => {
                                const config = SEVERITY_CONFIG[flag.severity];
                                const Icon = config.icon;

                                return (
                                    <Link
                                        key={flag.id}
                                        href={`/admin/sessions?highlight=${flag.entityId}`}
                                        className={`flex items-start gap-3 p-3 hover:${config.bg} transition-colors group cursor-pointer`}
                                    >
                                        <div className={`p-1.5 rounded-lg ${config.bg}`}>
                                            <Icon className={`w-4 h-4 ${config.color}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <h4 className="font-bold text-sm text-gray-900 dark:text-white leading-tight">
                                                    {flag.title}
                                                </h4>
                                                {flag.time && (
                                                    <span className="text-[10px] text-gray-400 flex items-center gap-0.5 shrink-0">
                                                        <Clock className="w-3 h-3" />
                                                        {formatTime(flag.time)}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-0.5 truncate">
                                                {flag.description}
                                            </p>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0 mt-1" />
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
