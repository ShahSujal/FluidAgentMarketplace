import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromAuth } from '@/lib/config/privy-server';

const PRIVY_API_URL = 'https://api.privy.io/v1';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ walletId: string }> }
) {
    try {
        // 1. Verify authentication
        const authHeader = request.headers.get('Authorization');
        await getUserIdFromAuth(authHeader);

        const { walletId } = await params;
        const { searchParams } = new URL(request.url);
        const queryString = searchParams.toString();
        
        console.log("Query String :", queryString);
        // 2. Call Privy API to get balance
        const credentials = Buffer.from(
            `${process.env.NEXT_PUBLIC_PRIVY_APP_ID}:${process.env.PRIVY_APP_SECRET}`
        ).toString('base64');

        const response = await fetch(`${PRIVY_API_URL}/wallets/${walletId}/balance?${queryString}`, {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'privy-app-id': process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Privy API Error:', data);
            return NextResponse.json(
                { success: false, error: data.error || 'Failed to fetch balance', details: data },
                { status: response.status }
            );
        }

        return NextResponse.json({ success: true, ...data });

    } catch (error) {
        console.error('Error fetching wallet balance:', error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}
