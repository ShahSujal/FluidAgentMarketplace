import { NextRequest, NextResponse } from 'next/server';
import { privyServer, getUserIdFromAuth } from '@/lib/config/privy-server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ walletId: string }> }
) {
    try {
        // Verify authentication
        const authHeader = request.headers.get('authorization');
        const userId = await getUserIdFromAuth(authHeader);

        const { walletId } = await params;

        // Get user to verify wallet ownership
        const user = await privyServer.getUser(userId);

        const wallet = user.linkedAccounts.find(
            (account: any) => account.type === 'wallet' && account.id === walletId
        );

        if (!wallet) {
            return NextResponse.json(
                { success: false, error: 'Wallet not found or access denied' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            wallet: "good boy"
        });

    } catch (error) {
        console.error('Error fetching wallet details:', error);

        if (error instanceof Error && error.message.includes('authorization')) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch wallet details'
            },
            { status: 500 }
        );
    }
}
