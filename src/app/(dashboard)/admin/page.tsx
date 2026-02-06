import {
    getTodaySessionStats,
    getOperationalFlags,
    getRecentActivities,
    getScheduleData,
    getTeachersForFilter,
    getClassesForFilter
} from '@/lib/actions/dashboard';
import { TodayOverview } from '@/components/dashboard/TodayOverview';
import { FlagsAlerts } from '@/components/dashboard/FlagsAlerts';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { ScheduleCalendar } from '@/components/dashboard/ScheduleCalendar';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
    // Calculate week date range for calendar
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + 1); // Monday
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // Sunday
    weekEnd.setHours(23, 59, 59, 999);

    // Fetch all dashboard data in parallel
    const [
        stats,
        flags,
        activities,
        scheduleData,
        teachers,
        boards
    ] = await Promise.all([
        getTodaySessionStats(),
        getOperationalFlags(),
        getRecentActivities(10),
        getScheduleData({
            viewType: 'teacher',
            startDate: weekStart,
            endDate: weekEnd
        }),
        getTeachersForFilter(),
        getClassesForFilter()
    ]);

    return (
        <div className="space-y-6 pb-6">
            {/* Header */}
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                    Operations Dashboard
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                    Monitor today&apos;s execution, detect issues, and take action.
                </p>
            </div>

            {/* Today's Operations Overview */}
            <TodayOverview stats={stats} />

            {/* Flags & Activity Row */}
            <div className="grid gap-4 lg:grid-cols-2">
                <FlagsAlerts flags={flags} />
                <ActivityFeed activities={activities} />
            </div>

            {/* Schedule Calendar */}
            <ScheduleCalendar
                sessions={scheduleData}
                teachers={teachers}
                boards={boards}
                currentDate={today}
            />
        </div>
    );
}
