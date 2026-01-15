import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith('/admin') ||
                nextUrl.pathname.startsWith('/teacher') ||
                nextUrl.pathname.startsWith('/student');

            if (isOnDashboard) {
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated users to login page
            } else if (isLoggedIn) {
                // If user is already logged in and tries to access login page, 
                // redirect them to their respective dashboard? 
                // For now, allow access or redirect to proper dashboard if visiting root
                if (nextUrl.pathname === '/login' || nextUrl.pathname === '/') {
                    // Logic to redirect based on role would be here, but we can't access role easily in edge middleware yet 
                    // without session strategy or decoding token. 
                    // We'll keep it simple: allow for now, handle in page.
                }
            }
            return true;
        },
        // Add jwt callback to persist role
        async jwt({ token, user }) {
            if (user) {
                token.role = (user as any).role;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                (session.user as any).role = token.role;
            }
            return session;
        }
    },
    providers: [], // Configured in auth.ts
} satisfies NextAuthConfig;
