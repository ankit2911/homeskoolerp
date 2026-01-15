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
                if (nextUrl.pathname === '/login' || nextUrl.pathname === '/') {
                    const role = (auth.user as any).role;
                    if (role === 'ADMIN') return Response.redirect(new URL('/admin', nextUrl));
                    if (role === 'TEACHER') return Response.redirect(new URL('/teacher', nextUrl));
                    if (role === 'STUDENT') return Response.redirect(new URL('/student', nextUrl));
                    return Response.redirect(new URL('/student', nextUrl)); // Fallback
                }
            }
            return true;
        },
        // Add jwt callback to persist role
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.role = token.role;
            }
            return session;
        }
    },
    providers: [], // Configured in auth.ts
} satisfies NextAuthConfig;
