import { AdminHeader } from '@/components/admin/admin-header';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { SidebarProvider } from '@/components/admin/sidebar-provider';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full flex-col bg-muted/40 md:flex-row dark:bg-black">
                <AdminSidebar />
                <div className="flex flex-col flex-1">
                    <AdminHeader />
                    <main className="flex flex-col gap-4 p-4 md:p-6">
                        {children}
                    </main>
                </div>
            </div>
        </SidebarProvider>
    );
}
