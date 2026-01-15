'use server';

import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import { db } from '@/lib/db';

export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
) {
    try {
        const email = formData.get('email') as string;

        // Fetch user to determine role
        const user = await db.user.findUnique({
            where: { email },
            select: { role: true }
        });

        let redirectTo = '/student'; // Default
        if (user) {
            switch (user.role) {
                case 'ADMIN':
                    redirectTo = '/admin';
                    break;
                case 'TEACHER':
                    redirectTo = '/teacher';
                    break;
                case 'STUDENT':
                    redirectTo = '/student';
                    break;
            }
        }

        await signIn('credentials', {
            email: formData.get('email'),
            password: formData.get('password'),
            redirectTo,
        });
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Invalid credentials.';
                default:
                    return 'Something went wrong.';
            }
        }
        throw error;
    }
}
