'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, BookOpen, Users, GraduationCap, Calendar, FileText, Settings2 } from 'lucide-react';
import { useSidebar } from './sidebar-provider';

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
            { href: '/admin/configuration', label: 'Academic Config', icon: Settings2 },
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
    const { isCollapsed } = useSidebar();

    return (
        <div className={cn(
            "pb-8 min-h-screen border-r bg-card hidden md:block transition-all duration-300 ease-in-out shadow-elevation-1",
            isCollapsed ? "w-16" : "w-52",
            className
        )}>
            <div className="space-y-2 py-2">
                <div className={cn(
                    "px-4 py-3 flex items-center gap-2 overflow-hidden whitespace-nowrap",
                    isCollapsed && "justify-center px-0"
                )}>
                    <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold shrink-0">
                        HS
                    </div>
                    {!isCollapsed && (
                        <h2 className="text-xl font-semibold tracking-tight text-foreground font-heading">
                            Homeskool
                        </h2>
                    )}
                </div>
                <div className="px-2 py-1">
                    <div className="space-y-4">
                        {sidebarGroups.map((group) => (
                            <div key={group.label} className={cn("px-3", isCollapsed && "px-0")}>
                                {!isCollapsed && (
                                    <h3 className="mb-2 px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-inter">
                                        {group.label}
                                    </h3>
                                )}
                                <div className="space-y-1">
                                    {group.items.map((item) => (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={cn(
                                                "flex items-center rounded-lg transition-base group",
                                                isCollapsed ? "justify-center p-2 mx-2" : "px-3 py-1.5 text-xs font-medium",
                                                pathname === item.href
                                                    ? "bg-primary/10 text-primary shadow-sm"
                                                    : "text-foreground/70 hover:bg-muted hover:text-foreground"
                                            )}
                                        >
                                            <item.icon className={cn(
                                                "h-4 w-4 transition-all duration-200",
                                                !isCollapsed && "mr-3",
                                                pathname === item.href ? "text-primary fill-primary/20" : "text-muted-foreground group-hover:fill-muted-foreground/10"
                                            )} strokeWidth={2.5} />
                                            {!isCollapsed && item.label}
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
