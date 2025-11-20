import { PrivyClient } from '@privy-io/server-auth';

if (!process.env.NEXT_PUBLIC_PRIVY_APP_ID) {
    throw new Error('NEXT_PUBLIC_PRIVY_APP_ID is not set');
}

if (!process.env.PRIVY_APP_SECRET) {
    throw new Error('PRIVY_APP_SECRET is not set');
}

// Initialize Privy server client
export const privyServer = new PrivyClient(
    process.env.NEXT_PUBLIC_PRIVY_APP_ID,
    process.env.PRIVY_APP_SECRET
);

/**
 * Verify and decode a Privy access token
 * @param authToken - The authorization token from the request header
 * @returns The verified user claims
 */
export async function verifyPrivyToken(authToken: string) {
    try {
        const token = authToken.replace('Bearer ', '');
        const claims = await privyServer.verifyAuthToken(token);
        return claims;
    } catch (error) {
        console.error('Token verification failed:', error);
        throw new Error('Invalid or expired token');
    }
}

/**
 * Get user ID from authorization header
 * @param authHeader - The authorization header value
 * @returns The user ID
 */
export async function getUserIdFromAuth(authHeader: string | null): Promise<string> {
    if (!authHeader) {
        throw new Error('No authorization header provided');
    }

    const claims = await verifyPrivyToken(authHeader);
    return claims.userId;
}
