import {getServerSession} from 'next-auth';
import {authOptions} from '@/app/api/auth/[...nextauth]/route';
import {redirect} from 'next/navigation';
import {getToken} from 'next-auth/jwt';
import {NextRequest} from 'next/server';

/**
 * Checks if the currently authenticated user is in the allowed users list.
 * @param {NextAuthOptions} authOptions - The next-auth configuration object.
 * @returns The session object if the user is allowed, or null if not allowed or not signed in.
 */
export async function checkGoogle(): Promise<boolean> {
    const session = await getServerSession(authOptions);

    console.log(session);

    if (!session || !session.user?.email) {
        return redirect('/api/auth/signin');
    }

    const allowedUsersEnv = process.env.ALLOWED_USERS;
    if (!allowedUsersEnv) {
        // No allowed users configured, deny access by default
        return false;
    }

    // Create array of allowed emails, trimmed and lowercased
    const allowedUsers = allowedUsersEnv
        .split(';')
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean);

    const userEmail = session?.user?.email?.toLowerCase();
    if (!userEmail) {
        return false; // No email in session
    }

    return !!allowedUsers.includes(userEmail);
}

export function checkGoogleToken(request: NextRequest): boolean {
    const token = request.headers.get('Authorization')?.replace(/Bearer /, '');
    if (!token) return false;

    const allowedUsersEnv = process.env.ALLOWED_USERS;
    if (!allowedUsersEnv) {
        // No allowed users configured, deny access by default
        return false;
    }

    const decoded = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET
    });

    // Create array of allowed emails, trimmed and lowercased
    const allowedUsers = allowedUsersEnv
        .split(';')
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean);

    const userEmail = decoded?.email?.toLowerCase();
    if (!userEmail) {
        return false; // No email in token
    }

    return !!allowedUsers.includes(userEmail);
}