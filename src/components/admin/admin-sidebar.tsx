'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Settings, BookOpen, Users, GraduationCap, Calendar } from 'lucide-react';

const sidebarItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/boards', label: 'Boards', icon: Settings },
    { href: '/admin/classes', label: 'Classes', icon: BookOpen },
    { href: '/admin/subjects', label: 'Subjects', icon: BookOpen },
    { href: '/admin/teachers', label: 'Teachers', icon: Users },
    { href: '/admin/students', label: 'Students', icon: GraduationCap },
    { href: '/admin/sessions', label: 'Sessions', icon: Calendar },
];

export function AdminSidebar({ className }: { className?: string }) {
    const pathname = usePathname();

    return (
        <div className={cn("pb-12 min-h-screen border-r bg-gray-100/40 dark:bg-gray-800/40 hidden md:block w-64", className)}>
            <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                    <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                        Admin Portal
                    </h2>
                    <div className="space-y-1">
                        {sidebarItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-all",
                                    pathname === item.href ? "bg-accent text-accent-foreground" : "transparent"
                                )}
                            >
                                <item.icon className="mr-2 h-4 w-4" />
                                {item.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
