import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromAuth } from '@/lib/config/privy-server';

const PRIVY_API_URL = 'https://api.privy.io/v1';

export async function POST(request: NextRequest) {
    try {
        // Verify authentication
        const authHeader = request.headers.get('authorization');
        const userId = await getUserIdFromAuth(authHeader);

        // Parse request body
        const body = await request.json();
        const { chainType = 'ethereum', policyId } = body;

        // Create Basic Auth header
        const credentials = Buffer.from(
            `${process.env.NEXT_PUBLIC_PRIVY_APP_ID}:${process.env.PRIVY_APP_SECRET}`
        ).toString('base64');

        // Prepare request body
        const requestBody: any = {
            chain_type: chainType,
        };

        // Add policy_ids if provided (must be an array)
        if (policyId) {
            requestBody.policy_ids = [policyId];
        }

        // For user-owned wallets, we need to get the user's key quorum ID
        // First, get user data to find their key quorum
        const userResponse = await fetch(`${PRIVY_API_URL}/users/${userId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'privy-app-id': process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
            },
        });

        if (!userResponse.ok) {
            const error = await userResponse.json();
            throw new Error(error.message || 'Failed to fetch user data');
        }

        const userData = await userResponse.json();

        // Check if user already has a server wallet for this chain type
        const existingWallet = userData.linked_accounts?.find(
            (account: any) => account.wallet_client === 'privy' && account.chain_type === chainType
        );

        if (existingWallet) {
            return NextResponse.json({
                success: false,
                error: `You already have a server wallet for ${chainType}. Each user can only create one server wallet per chain type.`,
                existingWallet: {
                    id: existingWallet.id,
                    address: existingWallet.address,
                    chainType: existingWallet.chain_type,
                    createdAt: existingWallet.created_at,
                }
            }, { status: 400 });
        }


        // Create embedded wallet using Privy REST API
        const createWalletResponse = await fetch(`${PRIVY_API_URL}/wallets`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${credentials}`,
                'privy-app-id': process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
                'privy-user-id': userId, // Pass user ID in header
            },
            body: JSON.stringify(requestBody),
        });

        if (!createWalletResponse.ok) {
            const errorText = await createWalletResponse.text();
            console.error('Wallet creation failed:', errorText);
            let errorMessage = 'Failed to create wallet';
            try {
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.message || errorJson.error || errorMessage;
            } catch (e) {
                errorMessage = errorText || errorMessage;
            }
            throw new Error(errorMessage);
        }

        const wallet = await createWalletResponse.json();

        return NextResponse.json({
            success: true,
            wallet: {
                id: wallet.id,
                address: wallet.address,
                chainType: wallet.chain_type,
                createdAt: wallet.created_at,
            },
            policyApplied: !!policyId,
        }, { status: 201 });

    } catch (error) {
        console.error('Error creating wallet:', error);

        if (error instanceof Error && error.message.includes('authorization')) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create wallet'
            },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        // Verify authentication
        const authHeader = request.headers.get('authorization');
        const userId = await getUserIdFromAuth(authHeader);

        // Create Basic Auth header
        const credentials = Buffer.from(
            `${process.env.NEXT_PUBLIC_PRIVY_APP_ID}:${process.env.PRIVY_APP_SECRET}`
        ).toString('base64');

        // Get user data from Privy REST API
        const userResponse = await fetch(`${PRIVY_API_URL}/users/${userId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'privy-app-id': process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
            },
        });

        if (!userResponse.ok) {
            throw new Error('Failed to fetch user data');
        }

        const userData = await userResponse.json();

        const wallets = (userData.linked_accounts || [])
            .filter((account: any) => account.wallet_client === 'privy')
            .map((wallet: any) => ({
                id: wallet.id,
                address: wallet.address,
                chainType: wallet.chain_type,
                walletClient: wallet.wallet_client || 'privy',
                createdAt: wallet.created_at,
            }));

        return NextResponse.json({
            success: true,
            wallets,
        });

    } catch (error) {
        console.error('Error fetching wallets:', error);

        if (error instanceof Error && error.message.includes('authorization')) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch wallets'
            },
            { status: 500 }
        );
    }
}
