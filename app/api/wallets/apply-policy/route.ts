import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromAuth } from '@/lib/config/privy-server';

const PRIVY_API_URL = 'https://auth.privy.io/api/v1';

export async function POST(request: NextRequest) {
    try {
        // Verify authentication
        const authHeader = request.headers.get('authorization');
        await getUserIdFromAuth(authHeader);

        // Parse request body
        const body = await request.json();
        const { walletId, policyId } = body;

        if (!walletId || !policyId) {
            return NextResponse.json(
                { success: false, error: 'walletId and policyId are required' },
                { status: 400 }
            );
        }

        // Apply policy to the wallet using Privy REST API
        const applyPolicyResponse = await fetch(`${PRIVY_API_URL}/wallets/${walletId}/policy`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.PRIVY_APP_SECRET}`,
                'privy-app-id': process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
            },
            body: JSON.stringify({
                policy_id: policyId,
            }),
        });

        if (!applyPolicyResponse.ok) {
            const error = await applyPolicyResponse.json();
            throw new Error(error.message || 'Failed to apply policy');
        }

        return NextResponse.json({
            success: true,
            message: 'Policy applied successfully',
            walletId,
            policyId,
        });

    } catch (error) {
        console.error('Error applying policy:', error);

        if (error instanceof Error && error.message.includes('authorization')) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to apply policy'
            },
            { status: 500 }
        );
    }
}
