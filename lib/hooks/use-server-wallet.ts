import { useWallets } from '@privy-io/react-auth';
import { useMemo } from 'react';
import { BrowserProvider, Signer } from 'ethers';

/**
 * Hook to access the connected server wallet and its signer
 */
export function useServerWalletSigner() {
    const { wallets } = useWallets();

    // Find the embedded Privy wallet (server wallet)
    const serverWallet = useMemo(() =>
        wallets.find(w => w.walletClientType === 'privy'),
        [wallets]);

    /**
     * Get the Ethers.js Signer for the server wallet
     */
    const getSigner = async (): Promise<Signer | null> => {
        if (!serverWallet) return null;

        // Get the EIP-1193 provider
        const eip1193Provider = await serverWallet.getEthereumProvider();

        // Wrap in Ethers v6 BrowserProvider
        const provider = new BrowserProvider(eip1193Provider);

        // Get the signer
        return provider.getSigner();
    };

    return {
        serverWallet,
        getSigner,
        // Helper to check if server wallet is ready
        isReady: !!serverWallet
    };
}
