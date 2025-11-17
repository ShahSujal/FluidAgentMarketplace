import { ethers } from "ethers";
import type { AxiosInstance, InternalAxiosRequestConfig } from "axios";

interface PaymentOption {
  scheme: string;
  asset: string;
  network: string;
  payTo: string;
  maxAmountRequired: string;
  resource?: string;
  maxTimeoutSeconds?: number;
  outputSchema?: any;
  extra?: any;
  description?: string;
  mimeType?: string;
}

interface Challenge {
  message?: string;
  nonce?: string;
  chainId?: number;
  timestamp?: number;
  x402Version?: number;
  error?: string;
  accepts?: PaymentOption[];
}

interface SignedPayload {
  address: string;
  signature: string;
  nonce: string;
  message: string;
  chainId: number;
  timestamp: number;
}

interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  __retry402?: boolean;
}

function encodeHeader(obj: any): string {
  return Buffer.from(JSON.stringify(obj)).toString('base64');
}

export function with402Interceptor(api: AxiosInstance, signer: ethers.Wallet): AxiosInstance {
  api.interceptors.response.use(
    (res) => {
      console.log("✅ Request successful, status:", res.status);
      return res;
    },
    async (error) => {
      console.log("⚠️ Request failed with status:", error.response?.status);
      
      const original = error.config as ExtendedAxiosRequestConfig;

      // Only handle 402 Payment Required
      if (!error.response || error.response.status !== 402) {
        console.log("❌ Not a 402 error, rejecting");
        return Promise.reject(error);
      }

      // Prevent infinite retry loop
      if (original.__retry402) {
        console.log("❌ Already retried 402, giving up");
        return Promise.reject(error);
      }
      original.__retry402 = true;

      const challenge: Challenge = error.response.data;

      console.log("🔐 402 Payment Required - Challenge received:");
      console.log(JSON.stringify(challenge, null, 2));

      // Check if it's the initial 402 (with accepts array)
      if (challenge.accepts && Array.isArray(challenge.accepts)) {
        console.log("📋 Payment options:", challenge.accepts);
        
        const paymentOption = challenge.accepts[0];
        console.log("💳 Using payment option:", paymentOption);
        
        try {
          // Connect to Base Sepolia
          const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
          const connectedSigner = signer.connect(provider);
          
          console.log("🔗 Connected to Base Sepolia");
          
          // USDC contract address on Base Sepolia
          const usdcAddress = paymentOption.asset;
          const amount = paymentOption.maxAmountRequired; // in smallest units (6 decimals for USDC)
          
          // ERC20 ABI for transfer
          const erc20Abi = [
            "function transfer(address to, uint256 amount) returns (bool)",
            "function balanceOf(address owner) view returns (uint256)",
            "function decimals() view returns (uint8)"
          ];
          
          const usdcContract = new ethers.Contract(usdcAddress, erc20Abi, connectedSigner);
          
          // Check balance
          const balance = await usdcContract.balanceOf(await connectedSigner.getAddress());
          console.log("💰 USDC Balance:", balance.toString());
          
          if (balance < BigInt(amount)) {
            console.log("❌ Insufficient USDC balance");
            return Promise.reject(new Error("Insufficient USDC balance"));
          }
          
          // Execute the transfer
          console.log(`💸 Transferring ${amount} USDC to ${paymentOption.payTo}`);
          const tx = await usdcContract.transfer(paymentOption.payTo, amount);
          
          console.log("⏳ Transaction sent:", tx.hash);
          console.log("⏳ Waiting for confirmation...");
          
          const receipt = await tx.wait();
          
          console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
          console.log("🧾 Transaction hash:", receipt.hash);
          
          // Create payment proof with transaction details
          const paymentProof = {
            scheme: paymentOption.scheme,
            asset: paymentOption.asset,
            network: paymentOption.network,
            payTo: paymentOption.payTo,
            amount: amount,
            chainId: 84532,
            txHash: receipt.hash,
            blockNumber: receipt.blockNumber,
            from: await connectedSigner.getAddress()
          };
          
          console.log("📝 Payment proof:", paymentProof);
          
          // Encode into X-Payment header
          const headerValue = encodeHeader(paymentProof);
          
          console.log("📦 X-Payment header created with transaction proof");
          
          // Add header and retry
          original.headers = original.headers || {};
          original.headers["X-Payment"] = headerValue;
          
          console.log("📤 Retrying request with X-Payment header");
          
          return api(original);
          
        } catch (txError: any) {
          console.error("❌ Payment transaction failed:", txError.message);
          return Promise.reject(txError);
        }
      } else {
        console.log("❌ Unexpected 402 response format");
        return Promise.reject(error);
      }
    }
  );

  return api;
}
