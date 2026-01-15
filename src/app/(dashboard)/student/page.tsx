import { auth, signOut } from '@/auth';

export default async function StudentDashboard() {
    const session = await auth();

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold">Student Dashboard</h1>
            <p>Welcome, {session?.user?.name}</p>
            <form
                action={async () => {
                    'use server';
                    await signOut();
                }}
            >
                <button className="bg-red-500 text-white px-4 py-2 rounded mt-4">Sign Out</button>
            </form>
        </div>
    );
}
