'use client';

import { useState, useEffect } from 'react';
import { usePrivy, useFundWallet } from '@privy-io/react-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { createServerWallet, getUserWallets, applyPolicyToWallet, type Wallet } from '@/lib/helpers/wallet-api';
import { Loader2, Wallet as WalletIcon, Shield, Copy, CheckCircle2, ArrowDownToLine } from 'lucide-react';

export default function ServerWalletManager() {
    const { user, getAccessToken, authenticated, login, logout } = usePrivy();
    const { fundWallet } = useFundWallet();
    const [wallets, setWallets] = useState<Wallet[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingWallets, setLoadingWallets] = useState(false);
    const [chainType, setChainType] = useState<'ethereum' | 'solana' | 'bitcoin'>('ethereum');
    const [policyId, setPolicyId] = useState('');
    const [selectedWallet, setSelectedWallet] = useState('');
    const [applyPolicyId, setApplyPolicyId] = useState('');
    const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

    // Auto-load wallets when user authenticates
    useEffect(() => {
        if (authenticated) {
            handleLoadWallets();
        }
    }, [authenticated]);

    const handleCreateWallet = async () => {
        if (!authenticated) {
            toast.error('Please login first');
            return;
        }

        setLoading(true);
        try {
            const accessToken = await getAccessToken();
            if (!accessToken) {
                throw new Error('Failed to get access token');
            }

            const result = await createServerWallet(accessToken, {
                chainType,
                policyId: policyId || undefined,
            });

            if (result.success && result.wallet) {
                toast.success('Wallet created successfully!');
                setWallets([...wallets, result.wallet]);
                setPolicyId('');

                if (result.policyApplied) {
                    toast.success('Policy applied to wallet');
                } else if (policyId) {
                    toast.warning('Wallet created but policy application failed');
                }
            } else {
                toast.error(result.error || 'Failed to create wallet');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to create wallet');
        } finally {
            setLoading(false);
        }
    };

    const handleLoadWallets = async () => {
        if (!authenticated) {
            toast.error('Please login first');
            return;
        }

        setLoadingWallets(true);
        try {
            const accessToken = await getAccessToken();
            if (!accessToken) {
                throw new Error('Failed to get access token');
            }

            const result = await getUserWallets(accessToken);

            if (result.success && result.wallets) {
                setWallets(result.wallets);
                toast.success(`Loaded ${result.wallets.length} wallet(s)`);
            } else {
                toast.error(result.error || 'Failed to load wallets');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to load wallets');
        } finally {
            setLoadingWallets(false);
        }
    };

    const handleApplyPolicy = async () => {
        if (!selectedWallet || !applyPolicyId) {
            toast.error('Please select a wallet and enter a policy ID');
            return;
        }

        setLoading(true);
        try {
            const accessToken = await getAccessToken();
            if (!accessToken) {
                throw new Error('Failed to get access token');
            }

            const result = await applyPolicyToWallet(accessToken, {
                walletId: selectedWallet,
                policyId: applyPolicyId,
            });

            if (result.success) {
                toast.success('Policy applied successfully!');
                setApplyPolicyId('');
                setSelectedWallet('');
            } else {
                toast.error(result.error || 'Failed to apply policy');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to apply policy');
        } finally {
            setLoading(false);
        }
    };

    const handleFundWallet = async (address: string, chainType: string) => {
        try {
            await fundWallet({ address });
        } catch (error) {
            console.error('Error funding wallet:', error);
            toast.error('Failed to fund wallet');
        }
    };

    const copyToClipboard = async (address: string) => {
        try {
            await navigator.clipboard.writeText(address);
            setCopiedAddress(address);
            toast.success('Address copied to clipboard');
            setTimeout(() => setCopiedAddress(null), 2000);
        } catch (error) {
            toast.error('Failed to copy address');
        }
    };

    if (!authenticated) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Server Wallet Manager</CardTitle>
                    <CardDescription>Please login to manage your server wallets</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={login} className="w-full">
                        Login to Continue
                    </Button>
                </CardContent>
            </Card>
        );
    }


    return (
        <div className="space-y-6">
            {/* User Info Card */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-sm font-medium">Logged in as</p>
                            <p className="text-sm text-muted-foreground">
                                {user?.email?.address || user?.wallet?.address || 'Unknown user'}
                            </p>
                        </div>
                        <Button onClick={logout} variant="outline" size="sm">
                            Logout
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <WalletIcon className="h-5 w-5" />
                        Create Server Wallet
                    </CardTitle>
                    <CardDescription>
                        Create a new server-managed wallet with optional policy enforcement
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="chainType">Chain Type</Label>
                        <Select value={chainType} onValueChange={(value: any) => setChainType(value)}>
                            <SelectTrigger id="chainType">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ethereum">Ethereum</SelectItem>
                                <SelectItem value="solana">Solana</SelectItem>
                                <SelectItem value="bitcoin">Bitcoin</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="policyId">Policy ID (Optional)</Label>
                        <Input
                            id="policyId"
                            placeholder="Enter policy ID from Privy Dashboard"
                            value={policyId}
                            onChange={(e) => setPolicyId(e.target.value)}
                        />
                    </div>

                    {/* Warning if wallet already exists for selected chain type */}
                    {wallets.some(w => w.chainType === chainType) && (
                        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                            <p className="text-sm text-yellow-600 dark:text-yellow-500">
                                ⚠️ You already have a server wallet for {chainType}. Each user can only create one wallet per chain type.
                            </p>
                        </div>
                    )}

                    <Button
                        onClick={handleCreateWallet}
                        disabled={loading || wallets.some(w => w.chainType === chainType)}
                        className="w-full"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating...
                            </>
                        ) : wallets.some(w => w.chainType === chainType) ? (
                            'Wallet Already Exists'
                        ) : (
                            'Create Wallet'
                        )}
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Apply Policy to Existing Wallet
                    </CardTitle>
                    <CardDescription>
                        Apply or update policy on an existing wallet
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="selectedWallet">Select Wallet</Label>
                        <Select value={selectedWallet} onValueChange={setSelectedWallet}>
                            <SelectTrigger id="selectedWallet">
                                <SelectValue placeholder="Select a wallet" />
                            </SelectTrigger>
                            <SelectContent>
                                {wallets.map((wallet) => (
                                    <SelectItem key={wallet.id} value={wallet.id}>
                                        {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)} ({wallet.chainType})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="applyPolicyId">Policy ID</Label>
                        <Input
                            id="applyPolicyId"
                            placeholder="Enter policy ID from Privy Dashboard"
                            value={applyPolicyId}
                            onChange={(e) => setApplyPolicyId(e.target.value)}
                        />
                    </div>

                    <Button onClick={handleApplyPolicy} disabled={loading || !selectedWallet} className="w-full">
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Applying...
                            </>
                        ) : (
                            'Apply Policy'
                        )}
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Your Wallets</CardTitle>
                    <CardDescription>Server-managed wallets for user: {user?.id}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button onClick={handleLoadWallets} disabled={loadingWallets} variant="outline" className="w-full">
                        {loadingWallets ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Loading...
                            </>
                        ) : (
                            'Load Wallets'
                        )}
                    </Button>

                    {wallets.length > 0 ? (
                        <div className="space-y-3">
                            {wallets.map((wallet) => (
                                <div
                                    key={wallet.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                                >
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <p className="font-mono text-sm font-medium">{wallet.address}</p>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => copyToClipboard(wallet.address)}
                                                className="h-6 w-6 p-0"
                                            >
                                                {copiedAddress === wallet.address ? (
                                                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                                                ) : (
                                                    <Copy className="h-3 w-3" />
                                                )}
                                            </Button>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Chain: {wallet.chainType} • Client: {wallet.walletClient || 'privy'}
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleFundWallet(wallet.address, wallet.chainType)}
                                        className="ml-4"
                                    >
                                        <ArrowDownToLine className="mr-2 h-4 w-4" />
                                        Fund
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">
                            No wallets found. Create one or load your existing wallets.
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
