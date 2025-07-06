import { getServerSession } from "next-auth";
import type { AuthOptions } from "next-auth";

/**
 * Utility function to check if the current signed-in user is authorized
 * based on the ALLOWED_USERS environment variable.
 * 
 * @param authOptions - The next-auth configuration options
 * @returns The session if the user is authorized, null otherwise
 */
export async function getAuth(authOptions: AuthOptions) {
    // Get the current session using getServerSession
    const session = await getServerSession(authOptions);
    
    // If no session exists, return null
    if (!session?.user?.email) {
        return null;
    }
    
    // Get the allowed users from environment variable
    const allowedUsers = process.env.ALLOWED_USERS;
    
    // If ALLOWED_USERS is not set, deny access
    if (!allowedUsers) {
        return null;
    }
    
    // Split the allowed users by semicolon and check if current user's email is in the list
    const allowedEmails = allowedUsers.split(';').map(email => email.trim());
    const userEmail = session.user.email;
    
    // Return session if user is authorized, null otherwise
    return allowedEmails.includes(userEmail) ? session : null;
}