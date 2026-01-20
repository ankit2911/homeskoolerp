'use client';

import { Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { AdminSidebar } from './admin-sidebar';
import { UserNav } from './user-nav';
import { useSidebar } from './sidebar-provider';

export function AdminHeader() {
    const { isCollapsed, toggleSidebar } = useSidebar();

    return (
        <header className="flex items-center h-11 px-4 border-b shrink-0 bg-card shadow-elevation-1 z-50">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="hidden md:flex h-8 w-8 text-muted-foreground hover:text-primary" onClick={toggleSidebar}>
                    {isCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
                </Button>
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="icon" className="md:hidden">
                            <Menu className="h-5 w-5" />
                            <span className="sr-only">Toggle navigation menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-52">
                        <AdminSidebar className="block w-full border-none" />
                    </SheetContent>
                </Sheet>
            </div>
            <div className="flex items-center justify-end w-full gap-4 md:ml-auto md:gap-2 lg:gap-4">
                <UserNav />
            </div>
        </header>
    );
}
