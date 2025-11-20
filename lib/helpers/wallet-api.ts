/**
 * Client-side utilities for interacting with Privy server wallet API endpoints
 */

export interface Wallet {
    id: string;
    address: string;
    chainType: string;
    walletClient?: string;
    createdAt?: string;
}

export interface CreateWalletParams {
    chainType?: 'ethereum' | 'solana' | 'bitcoin';
    policyId?: string;
}

export interface ApplyPolicyParams {
    walletId: string;
    policyId: string;
}

/**
 * Get the Privy access token from the current session
 * This should be called from a component that has access to usePrivy hook
 */
export function getPrivyAccessToken(): string | null {
    // The token will be passed from the component using usePrivy
    return null;
}

/**
 * Create a new server wallet with optional policy
 */
export async function createServerWallet(
    accessToken: string,
    params: CreateWalletParams = {}
): Promise<{ success: boolean; wallet?: Wallet; error?: string; policyApplied?: boolean }> {
    try {
        const response = await fetch('/api/wallets/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify(params),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to create wallet');
        }

        return data;
    } catch (error) {
        console.error('Error creating wallet:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create wallet',
        };
    }
}

/**
 * Apply a policy to an existing wallet
 */
export async function applyPolicyToWallet(
    accessToken: string,
    params: ApplyPolicyParams
): Promise<{ success: boolean; error?: string }> {
    try {
        const response = await fetch('/api/wallets/apply-policy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify(params),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to apply policy');
        }

        return data;
    } catch (error) {
        console.error('Error applying policy:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to apply policy',
        };
    }
}

/**
 * Get details for a specific wallet
 */
export async function getWalletDetails(
    accessToken: string,
    walletId: string
): Promise<{ success: boolean; wallet?: Wallet; error?: string }> {
    try {
        const response = await fetch(`/api/wallets/${walletId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch wallet details');
        }

        return data;
    } catch (error) {
        console.error('Error fetching wallet details:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch wallet details',
        };
    }
}

/**
 * Get all wallets for the authenticated user
 */
export async function getUserWallets(
    accessToken: string
): Promise<{ success: boolean; wallets?: Wallet[]; error?: string }> {
    try {
        const response = await fetch('/api/wallets/create', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch wallets');
        }

        return data;
    } catch (error) {
        console.error('Error fetching wallets:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch wallets',
        };
    }
}
export interface Balance {
    chain: string;
    asset: string;
    raw_value: string;
    raw_value_decimals: number;
    display_values: {
        eth?: string;
        usd?: string;
        [key: string]: string | undefined;
    };
}

export interface GetBalanceOptions {
    asset?: string;
    chain?: string;
    include_currency?: string;
}

/**
 * Get balance for a specific wallet
 */
export async function getWalletBalance(
    accessToken: string,
    walletId: string,
    options: GetBalanceOptions = {}
): Promise<{ success: boolean; balances?: Balance[]; error?: string }> {
    try {
        const queryParams = new URLSearchParams();
        if (options.asset) queryParams.append('asset', options.asset);
        if (options.chain) queryParams.append('chain', options.chain);
        if (options.include_currency) queryParams.append('include_currency', options.include_currency);

        const queryString = queryParams.toString();
        const url = `/api/wallets/${walletId}/balance${queryString ? `?${queryString}` : ''}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch wallet balance');
        }

        return data;
    } catch (error) {
        console.error('Error fetching wallet balance:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch wallet balance',
        };
    }
}
