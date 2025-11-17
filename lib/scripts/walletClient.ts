// utils/walletClientToSigner.ts
import type { WalletClient } from "viem";
import { BrowserProvider } from "ethers";
import { Signer } from "x402-axios";

export async function walletClientToSigner(walletClient: WalletClient): Promise<Signer> {
  const { account, chain, transport } = walletClient;
  if (!account || !chain) throw new Error("Missing account or chain");

  // Convert viem WalletClient to ethers.js signer
  // The transport is an EIP-1193 provider that ethers can wrap
  const provider = new BrowserProvider(transport as any);
  const signer = await provider.getSigner(account.address);
  
  return signer as unknown as Signer;
}
