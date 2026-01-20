import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Users, BookOpen, GraduationCap, Calendar,
    Plus, UserPlus,
    Upload, ArrowUpRight, ArrowDownRight,
    ChevronRight, Bell, MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function AdminDashboard() {


    const stats = [
        {
            label: 'Total Students',
            value: await db.user.count({ where: { role: 'STUDENT' } }),
            icon: GraduationCap,
            color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
            trend: '+12.5%',
            trendUp: true
        },
        {
            label: 'Total Teachers',
            value: await db.user.count({ where: { role: 'TEACHER' } }),
            icon: Users,
            color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
            trend: '+5.2%',
            trendUp: true
        },
        {
            label: 'Active Classes',
            value: await db.class.count(),
            icon: BookOpen,
            color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
            trend: '+2',
            trendUp: true
        },
        {
            label: 'Current Sessions',
            value: await db.session.count(),
            icon: Calendar,
            color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
            trend: '-3.1%',
            trendUp: false
        }
    ];

    const quickActions = [
        { label: 'Add New Student', description: 'Enroll new students and assign classes', icon: UserPlus, color: 'text-blue-600', href: '/admin/students' },
        { label: 'Create Class', description: 'Set up new classes with subjects', icon: Plus, color: 'text-emerald-600', href: '/admin/configuration?action=create-class' },
        { label: 'Configure Subjects', description: 'Manage subjects and assignments', icon: MessageSquare, color: 'text-purple-600', href: '/admin/configuration?action=bulk-map' },
        { label: 'Upload Curriculum', description: 'Upload and manage documents', icon: Upload, color: 'text-orange-600', badge: 'New', href: '/admin/curriculum' }
    ];

    return (
        <div className="space-y-6 pb-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">Admin Dashboard</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Welcome back! Here&apos;s what&apos;s happening in your school today.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.label} className="border-0 shadow-elevation-1 transition-base hover:shadow-elevation-2">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 font-inter">{stat.label}</p>
                                    <h3 className="text-2xl font-black text-foreground font-heading">{stat.value.toLocaleString()}</h3>
                                </div>
                                <div className={`p-3 rounded-2xl ${stat.color}`}>
                                    <stat.icon className="w-6 h-6 fill-current/20" strokeWidth={2.5} />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`flex items-center gap-0.5 text-sm font-bold ${stat.trendUp ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {stat.trendUp ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                                    {stat.trend}
                                </span>
                                <span className="text-sm font-medium text-gray-400">vs last month</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="max-w-4xl">
                <h2 className="text-xl font-heading font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">Administrator&apos;s Quick Actions</h2>
                <div className="grid gap-4 md:grid-cols-2">
                    {quickActions.map((action) => (
                        <Link key={action.label} href={action.href}>
                            <Card className="border-0 shadow-elevation-1 transition-base hover:shadow-elevation-2 group cursor-pointer h-full">
                                <CardContent className="p-4 flex items-center justify-between h-full">
                                    <div className="flex gap-4 items-center">
                                        <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center shrink-0">
                                            <action.icon className={`w-6 h-6 ${action.color} fill-current/10`} strokeWidth={2.5} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-foreground font-heading">{action.label}</h4>
                                                {action.badge && (
                                                    <span className="text-[10px] font-bold bg-accent/10 text-accent px-1.5 py-0.5 rounded uppercase">{action.badge}</span>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground">{action.description}</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary transition-colors" />
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Recent Activities & Upcoming Sessions */}
            <div className="grid gap-4 lg:grid-cols-3">
                <Card className="lg:col-span-2 border-0 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-gray-50 dark:border-gray-800 px-4 py-3">
                        <CardTitle className="text-base font-bold">Recent Activities</CardTitle>
                        <div className="flex bg-gray-50 dark:bg-gray-800 p-1 rounded-lg">
                            <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold bg-white dark:bg-gray-700 shadow-sm">Activities</Button>
                            <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold text-gray-500">Notifications</Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4">
                        <div className="space-y-4">
                            {[
                                { title: 'New Student Enrollment', user: 'Admin User', time: '5 mins ago', description: 'Priya Sharma has been enrolled in Class 10-A (CBSE)', icon: UserPlus, color: 'text-emerald-600' },
                                { title: 'Session Updated', user: 'Rajesh Kumar', time: '15 mins ago', description: 'Mathematics session for Class 9-B rescheduled to 10:30 AM', icon: Calendar, color: 'text-blue-600' },
                                { title: 'System Notification', user: 'System', time: '1 hour ago', description: 'Attendance report for January 2026 is now available', icon: Bell, color: 'text-orange-600' }
                            ].map((activity, idx) => (
                                <div key={idx} className="flex gap-4">
                                    <div className={`w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center shrink-0`}>
                                        <activity.icon className={`w-5 h-5 ${activity.color} fill-current/10`} strokeWidth={2.5} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <h5 className="font-bold text-gray-900 dark:text-white leading-none">{activity.title}</h5>
                                            <span className="text-xs text-gray-400 font-medium">{activity.time}</span>
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{activity.description}</p>
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold">
                                                {activity.user[0]}
                                            </div>
                                            <span className="text-xs font-bold text-gray-400">{activity.user}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-gray-50 dark:border-gray-800 px-4 py-3">
                        <CardTitle className="text-base font-bold">Upcoming Sessions</CardTitle>
                        <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold text-primary">View All</Button>
                    </CardHeader>
                    <CardContent className="p-4">
                        <div className="grid gap-4">
                            {[
                                { subject: 'Mathematics', class: 'Class 10-A', teacher: 'Rajesh Kumar', time: '09:00 AM - 10:00 AM', status: 'Scheduled', statusColor: 'text-emerald-600 bg-emerald-50' },
                                { subject: 'Physics', class: 'Class 12-B', teacher: 'Anita Desai', time: '10:30 AM - 11:30 AM', status: 'Pending', statusColor: 'text-orange-600 bg-orange-50' }
                            ].map((session, idx) => (
                                <div key={idx} className="p-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                                    <div className="flex justify-between items-start mb-2">
                                        <h5 className="font-bold text-gray-900 dark:text-white leading-none">{session.subject}</h5>
                                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded uppercase ${session.statusColor}`}>{session.status}</span>
                                    </div>
                                    <p className="text-xs font-bold text-gray-400 mb-4">{session.class}</p>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <Users className="w-3.5 h-3.5" />
                                            <span className="font-medium">{session.teacher}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <Calendar className="w-3.5 h-3.5" />
                                            <span className="font-medium">{session.time}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
