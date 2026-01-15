import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 dark:from-indigo-950 dark:via-purple-950 dark:to-pink-950">
            <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02] -z-10" />
            <div className="flex flex-col items-center gap-2 mb-8">
                <div className="p-3 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/20">
                    {/* Logo placeholder or Icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-white"><path d="M22 10v6M2 10v6" /><path d="M20 22a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2" /><path d="M22 10a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2" /><path d="zM22 10V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v6" /></svg>
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Homeskool ERP</h1>
            </div>
            <LoginForm />
        </main>
    );
}
