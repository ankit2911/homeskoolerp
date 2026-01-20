import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-[#f8faff] dark:bg-gray-950">
            <div className="absolute inset-0 bg-grid-slate-200/[0.15] dark:bg-grid-white/[0.05] -z-10" />

            <div className="flex flex-col items-center gap-4 mb-10 text-center">
                <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-white">
                        <path d="M22 10v6M2 10v6" />
                        <path d="M6 12l6-6 6 6" />
                        <path d="M6 12v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V12" />
                    </svg>
                </div>
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-2">SchoolERP</h1>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Comprehensive School Management System</p>
                </div>
            </div>

            <LoginForm />

            <p className="mt-8 text-sm text-gray-500 dark:text-gray-400">
                Need help? Contact your school administrator
            </p>
        </main>
    );
}
