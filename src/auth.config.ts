import type { NextAuthConfig } from 'next-auth';
import type { Session } from 'next-auth';
import type { NextRequest } from 'next/server';

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request }: { auth: Session | null; request: NextRequest }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = request.nextUrl.pathname.startsWith('/admin') ||
                request.nextUrl.pathname.startsWith('/teacher') ||
                request.nextUrl.pathname.startsWith('/student');

            if (isOnDashboard) {
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated users to login page
            } else if (isLoggedIn) {
                if (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/') {
                    const role = auth.user.role;
                    if (role === 'ADMIN') return Response.redirect(new URL('/admin', request.nextUrl));
                    if (role === 'TEACHER') return Response.redirect(new URL('/teacher', request.nextUrl));
                    if (role === 'STUDENT') return Response.redirect(new URL('/student', request.nextUrl));
                    return Response.redirect(new URL('/student', request.nextUrl)); // Fallback
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
