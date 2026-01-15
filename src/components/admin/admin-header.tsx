'use client';

import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { AdminSidebar } from './admin-sidebar';
import { UserNav } from './user-nav';

export function AdminHeader() {
    return (
        <header className="flex items-center h-16 px-4 border-b shrink-0 md:px-6 bg-white dark:bg-gray-900">
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="md:hidden">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-64">
                    <AdminSidebar className="block w-full border-none" />
                </SheetContent>
            </Sheet>
            <div className="flex items-center justify-end w-full gap-4 md:ml-auto md:gap-2 lg:gap-4">
                <UserNav />
            </div>
        </header>
    );
}
