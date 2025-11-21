"use client";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useFundWallet, usePrivy } from "@privy-io/react-auth"
import { User, Wallet, LogOut, Loader2, RefreshCw, Copy, ExternalLink, Plus, Settings, CreditCard, Shield } from "lucide-react"
import { useEffect, useState } from "react"
import { getUserWallets, createServerWallet, getWalletBalance, applyPolicyToWallet, type Wallet as WalletType } from "@/lib/helpers/wallet-api"
import { toast } from "sonner"

const Page = () => {
  const { user, authenticated, logout, getAccessToken, ready } = usePrivy()
  const [serverWallet, setServerWallet] = useState<WalletType | null>(null)
  const [balance, setBalance] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isBalanceLoading, setIsBalanceLoading] = useState(false)
  const [isFundDialogOpen, setIsFundDialogOpen] = useState(false)
  const [isPolicyDialogOpen, setIsPolicyDialogOpen] = useState(false)
  const [policyId, setPolicyId] = useState("")
  const [isFunding, setIsFunding] = useState(false)
  const [isApplyingPolicy, setIsApplyingPolicy] = useState(false)
  const { fundWallet } = useFundWallet();

  const fetchBalance = async (walletId: string) => {
    setIsBalanceLoading(true)
    try {
      const token = await getAccessToken()
      if (!token) return

      // Fetch USDC balance on Base Sepolia as requested
      const result = await getWalletBalance(token, walletId, {
        asset: 'usdc',
        chain: 'base_sepolia',
        include_currency: 'usd'
      })
      if (result.success && result.balances && result.balances.length > 0) {
        // Prefer ETH, otherwise take the first one
        const balanceItem = result.balances.find(b => b.asset === 'eth') || result.balances[0]

        // Determine symbol (e.g. ETH, USDC)
        const symbol = balanceItem.asset ? balanceItem.asset.toUpperCase() : 'USDC'

        // Get display value: try asset-specific key, then 'usd', then fallback
        const displayValue = balanceItem.display_values?.[balanceItem.asset] ||
          balanceItem.display_values?.['usd'] ||
          '0'

        setBalance(`${parseFloat(displayValue).toFixed(4)} ${symbol}`)
      } else {
        setBalance("0.0000 USDC")
      }
    } catch (error) {
      console.error("Error fetching balance:", error)
      setBalance("Error")
    } finally {
      setIsBalanceLoading(false)
    }
  }

  const handleCopyAddress = () => {
    if (serverWallet?.address) {
      navigator.clipboard.writeText(serverWallet.address)
      toast.success("Wallet address copied to clipboard")
    }
  }

  const handleFundWallet = async () => {
    if (!serverWallet) {
      toast.error("No wallet available")
      return
    }

    setIsFunding(true)
    try {
      await fundWallet({ address: serverWallet.address })
      toast.success("Successfully funded your wallet")
      setIsFundDialogOpen(false)
      
      // Refresh balance after funding
      fetchBalance(serverWallet.id)
    } catch (error) {
      console.error('Error funding wallet:', error)
      toast.error('Failed to fund wallet')
    } finally {
      setIsFunding(false)
    }
  }


  const handleApplyPolicy = async () => {
    if (!serverWallet || !policyId.trim()) {
      toast.error("Please enter a valid policy ID")
      return
    }

    setIsApplyingPolicy(true)
    try {
      const token = await getAccessToken()
      if (!token) {
        toast.error("Authentication required")
        return
      }

      const result = await applyPolicyToWallet(token, {
        walletId: serverWallet.id,
        policyId: policyId.trim()
      })

      if (result.success) {
        toast.success(`Successfully applied policy ${policyId} to wallet`)
        setPolicyId("")
        setIsPolicyDialogOpen(false)
      } else {
        toast.error(result.error || "Failed to apply policy")
      }
    } catch (error) {
      console.error("Error applying policy:", error)
      toast.error("Failed to apply policy")
    } finally {
      setIsApplyingPolicy(false)
    }
  }

  useEffect(() => {
    const fetchOrCreateWallet = async () => {
      if (!ready || !authenticated) return

      setIsLoading(true)
      try {
        const token = await getAccessToken()
        if (!token) return

        // 1. Check for existing wallets
        const walletsResult = await getUserWallets(token)

        if (walletsResult.success && walletsResult.wallets && walletsResult.wallets.length > 0) {
          const ethWallet = walletsResult.wallets.find(w => w.chainType === 'ethereum')
          const walletToUse = ethWallet || walletsResult.wallets[0]
          setServerWallet(walletToUse)
          fetchBalance(walletToUse.id)
        } else {
          // 2. Create wallet if none exist
          if (serverWallet) return

          toast.info("Creating your server wallet...")
          const createResult = await createServerWallet(token, { chainType: 'ethereum', policyId: "kradkjp957x67zd9k9h383sm" })

          if (createResult.success && createResult.wallet) {
            setServerWallet(createResult.wallet)
            toast.success("Server wallet created automatically")
            fetchBalance(createResult.wallet.id)
          } else {
            console.error("Failed to auto-create wallet:", createResult.error)
          }
        }
      } catch (error) {
        console.error("Error in wallet fetch/create:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrCreateWallet()
  }, [ready, authenticated, getAccessToken])

  if (!ready || !authenticated) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex h-screen items-center justify-center">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">Loading...</p>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <h1 className="text-lg font-semibold">Wallet Details</h1>
          </div>
        </header>
        
        <div className="flex-1 p-4 space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">Loading wallet...</p>
              </div>
            </div>
          ) : serverWallet ? (
            <>
              {/* Wallet Overview Card */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Wallet className="h-5 w-5" />
                        Server Wallet
                      </CardTitle>
                      <CardDescription>
                        Your secure server-managed wallet
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">
                      Active
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                        Wallet Address
                      </Label>
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                        <code className="flex-1 font-mono text-sm text-foreground">
                          {serverWallet.address}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCopyAddress}
                          className="shrink-0"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                        Chain Type
                      </Label>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <span className="capitalize font-medium">{serverWallet.chainType}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Balance Card */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Balance
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fetchBalance(serverWallet.id)}
                      disabled={isBalanceLoading}
                    >
                      <RefreshCw className={`h-4 w-4 ${isBalanceLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    {isBalanceLoading ? (
                      <div className="flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="text-3xl font-bold text-foreground">
                          {balance || "0.0000 USDC"}
                        </div>
                        <p className="text-muted-foreground">
                          Base Sepolia Testnet
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Action Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Fund Wallet Card */}
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/70 transition-colors">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Plus className="h-5 w-5 text-green-500" />
                      Fund Wallet
                    </CardTitle>
                    <CardDescription>
                      Get testnet funds for your wallet
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Dialog open={isFundDialogOpen} onOpenChange={setIsFundDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full" variant="outline">
                          <Plus className="mr-2 h-4 w-4" />
                          Fund Wallet
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Fund Your Wallet</DialogTitle>
                          <DialogDescription>
                            Add testnet funds to your wallet. This will provide you with test tokens to interact with the platform.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                          <p className="text-sm text-muted-foreground text-center">
                            Click the button below to add testnet funds to your wallet address:
                          </p>
                          <p className="text-xs font-mono mt-2 p-2 bg-muted rounded text-center break-all">
                            {serverWallet?.address}
                          </p>
                        </div>
                        <DialogFooter>
                          <Button
                            onClick={handleFundWallet}
                            disabled={isFunding}
                            className="w-full"
                          >
                            {isFunding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isFunding ? "Funding..." : "Fund Wallet"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>

                {/* Policy Management Card */}
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/70 transition-colors">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Shield className="h-5 w-5 text-blue-500" />
                      Policy Management
                    </CardTitle>
                    <CardDescription>
                      Apply security policies to your wallet
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Dialog open={isPolicyDialogOpen} onOpenChange={setIsPolicyDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full" variant="outline">
                          <Settings className="mr-2 h-4 w-4" />
                          Apply Policy
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Apply Security Policy</DialogTitle>
                          <DialogDescription>
                            Enter a policy ID to apply additional security measures to your wallet.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="policy">Policy ID</Label>
                            <Input
                              id="policy"
                              placeholder="kradkjp957x67zd9k9h383sm"
                              value={policyId}
                              onChange={(e) => setPolicyId(e.target.value)}
                              className="col-span-3"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            onClick={handleApplyPolicy}
                            disabled={isApplyingPolicy || !policyId.trim()}
                            className="w-full"
                          >
                            {isApplyingPolicy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isApplyingPolicy ? "Applying..." : "Apply Policy"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              </div>

              {/* Wallet Info Card */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Wallet Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                        Wallet ID
                      </Label>
                      <p className="font-mono text-sm mt-1">{serverWallet.id}</p>
                    </div>
                    
                    {serverWallet.createdAt && (
                      <div>
                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                          Created
                        </Label>
                        <p className="text-sm mt-1">
                          {new Date(serverWallet.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-2">
                    <Button variant="outline" size="sm" className="gap-2">
                      <ExternalLink className="h-4 w-4" />
                      View on Explorer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Wallet Found</h3>
                <p className="text-muted-foreground text-center">
                  We couldn't find or create a wallet for your account. Please try again.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Page;
