'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Settings, BookOpen, Users, GraduationCap, Calendar, FileText } from 'lucide-react';

const sidebarGroups = [
    {
        label: 'Overview',
        items: [
            { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
        ]
    },
    {
        label: 'Academic',
        items: [
            { href: '/admin/boards', label: 'Boards', icon: Settings },
            { href: '/admin/classes', label: 'Classes', icon: BookOpen },
            { href: '/admin/subjects', label: 'Subjects', icon: BookOpen },
            { href: '/admin/curriculum', label: 'Curriculum', icon: BookOpen },
            { href: '/admin/resources', label: 'Resources', icon: FileText },
        ]
    },
    {
        label: 'Users',
        items: [
            { href: '/admin/teachers', label: 'Teachers', icon: Users },
            { href: '/admin/students', label: 'Students', icon: GraduationCap },
            { href: '/admin/allocations', label: 'Allocations', icon: BookOpen },
        ]
    },
    {
        label: 'Schedule',
        items: [
            { href: '/admin/sessions', label: 'Sessions', icon: Calendar },
        ]
    }
];

export function AdminSidebar({ className }: { className?: string }) {
    const pathname = usePathname();

    return (
        <div className={cn("pb-12 min-h-screen border-r bg-sidebar hidden md:block w-64 shadow-sm", className)}>
            <div className="space-y-4 py-4">
                <div className="px-6 py-4 flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
                        HS
                    </div>
                    <h2 className="text-xl font-bold tracking-tight text-sidebar-foreground">
                        Homeskool
                    </h2>
                </div>
                <div className="px-3 py-2">
                    <div className="space-y-6">
                        {sidebarGroups.map((group) => (
                            <div key={group.label} className="px-3">
                                <h3 className="mb-2 px-4 text-xs font-semibold text-muted-foreground/70 tracking-wider uppercase">
                                    {group.label}
                                </h3>
                                <div className="space-y-1">
                                    {group.items.map((item) => (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={cn(
                                                "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                                                pathname === item.href
                                                    ? "bg-sidebar-accent text-primary shadow-sm"
                                                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                                            )}
                                        >
                                            <item.icon className={cn("mr-3 h-4 w-4", pathname === item.href ? "text-primary" : "text-muted-foreground")} />
                                            {item.label}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
