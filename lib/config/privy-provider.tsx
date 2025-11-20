'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { ReactNode } from 'react';
import { baseSepolia, mainnet } from 'viem/chains';

export default function Providers({ children }: { children: ReactNode }) {
    return (
        <PrivyProvider
            appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
            config={{
                loginMethods: ['email', 'wallet'],
                appearance: {
                    theme: 'light',
                    accentColor: '#676FFF',
                },
                embeddedWallets: {
                    ethereum: {
                        createOnLogin: 'users-without-wallets',
                    },
                },
                // Enable server-side wallet management
                supportedChains: [
                    baseSepolia,
                    mainnet
                ],
            }}
        >
            {children}
        </PrivyProvider>
    );
}
