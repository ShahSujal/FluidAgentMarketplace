"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { usePrivy } from "@privy-io/react-auth"
import { User, Wallet, LogOut, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { getUserWallets, createServerWallet } from "@/lib/helpers/wallet-api"
import { toast } from "sonner"

export function SiteHeader() {
  const { user, authenticated, logout, getAccessToken, ready } = usePrivy()
  const [serverAddress, setServerAddress] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

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
          // Prefer Ethereum wallet, otherwise take the first one
          const ethWallet = walletsResult.wallets.find(w => w.chainType === 'ethereum')
          const walletToUse = ethWallet || walletsResult.wallets[0]
          setServerAddress(walletToUse.address)
        } else {
          // 2. Create wallet if none exist
          // Check if we already have a pending creation to avoid race conditions (basic check)
          if (serverAddress) return

          toast.info("Creating your server wallet...")
          const createResult = await createServerWallet(token, { chainType: 'ethereum', policyId:"d268r71p1l2cwyegpmx5qdkf" })

          if (createResult.success && createResult.wallet) {
            setServerAddress(createResult.wallet.address)
            toast.success("Server wallet created automatically")
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
  }, [ready, authenticated, getAccessToken]) // Removed serverAddress from deps to avoid loops

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
                  {serverAddress
                    ? `${serverAddress.slice(0, 6)}...${serverAddress.slice(-4)}`
                    : isLoading ? "Loading..." : "No Wallet"}
                </span>
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
