"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { usePrivy } from "@privy-io/react-auth"
import { User, Wallet, LogOut, Loader2, RefreshCw } from "lucide-react"
import { useEffect, useState } from "react"
import { getUserWallets, createServerWallet, getWalletBalance, type Wallet as WalletType } from "@/lib/helpers/wallet-api"
import { toast } from "sonner"

export function SiteHeader() {
  const { user, authenticated, logout, getAccessToken, ready } = usePrivy()
  const [serverWallet, setServerWallet] = useState<WalletType | null>(null)
  const [balance, setBalance] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isBalanceLoading, setIsBalanceLoading] = useState(false)

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

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <div className="ml-auto flex items-center gap-2">
          {authenticated && (
            <>
              <div className="flex items-center gap-2 mr-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-md">
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Wallet className="h-4 w-4" />
                )}
                <span className="font-mono">
                  {serverWallet
                    ? `${serverWallet.address.slice(0, 6)}...${serverWallet.address.slice(-4)}`
                    : isLoading ? "Loading..." : "No Wallet"}
                </span>
                {serverWallet && (
                  <>
                    <Separator orientation="vertical" className="h-4 mx-1" />
                    <span className="font-mono">
                      {isBalanceLoading ? (
                        <Loader2 className="h-3 w-3 animate-spin inline" />
                      ) : (
                        balance || "0.0000 ETH"
                      )}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 ml-1"
                      onClick={() => serverWallet && fetchBalance(serverWallet.id)}
                      disabled={isBalanceLoading}
                      title="Refresh Balance"
                    >
                      <RefreshCw className={`h-3 w-3 ${isBalanceLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  </>
                )}
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => logout()}
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
