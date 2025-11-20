'use client';

import ServerWalletManager from '@/components/server-wallet-manager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ServerWalletsPage() {
    return (
        <div className="container mx-auto py-10 px-4">
            <div className="mb-8">
                <h1 className="text-4xl font-bold mb-2">Server Wallet Management</h1>
                <p className="text-muted-foreground">
                    Create and manage server-controlled wallets with policy enforcement
                </p>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>About Server Wallets</CardTitle>
                        <CardDescription>
                            Server wallets are embedded wallets that can be managed from your backend with policy controls
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex items-start gap-2">
                            <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                            <p className="text-sm">
                                <strong>Backend Control:</strong> Wallets are created and managed via API calls from your server
                            </p>
                        </div>
                        <div className="flex items-start gap-2">
                            <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                            <p className="text-sm">
                                <strong>Policy Enforcement:</strong> Apply policies to restrict wallet actions (transfer limits, allowlists, etc.)
                            </p>
                        </div>
                        <div className="flex items-start gap-2">
                            <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                            <p className="text-sm">
                                <strong>Multi-Chain Support:</strong> Create wallets for Ethereum, Solana, or Bitcoin networks
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <ServerWalletManager />
            </div>
        </div>
    );
}
