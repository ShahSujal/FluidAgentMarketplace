import axios, { AxiosError, AxiosInstance } from "axios";
import { Wallet, TypedDataDomain } from "ethers";

// ---------------------
// TYPES
// ---------------------
export type PaymentRequirements = {
  scheme?: string;
  network?: string;
  maxAmountRequired: string;
  resource?: string;
  description?: string;
  mimeType?: string;
  payTo: string;
  maxTimeoutSeconds?: number;
  asset: string;
  outputReference?: string;
};

export type SignRequest = {
  chainId: number;
  token: string;
  amount: string;
  receiver: string;
  nonce: string;
  expiry: string;
  version: string;
};

// ---------------------
// CONSTANTS
// ---------------------
const X402_VERIFIER = "0x0000000000000000000000000000000000000402";

const TYPES = {
  Payment: [
    { name: "payer", type: "address" },
    { name: "receiver", type: "address" },
    { name: "token", type: "address" },
    { name: "amount", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "expiry", type: "uint256" },
  ],
};

// ---------------------
// MAIN CLIENT
// ---------------------
export class X402Client {
  private axios: AxiosInstance;
  private wallet: Wallet;

  constructor(wallet: Wallet) {
    this.wallet = wallet;

    this.axios = axios.create({
      validateStatus: () => true,
    });

    // attach interceptor
    this.axios.interceptors.request.use((config) =>
      this.attachX402Header(config)
    );
    
    // Add response interceptor to handle 402 Payment Required
    this.axios.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (!error.response || error.response.status !== 402) {
          return Promise.reject(error);
        }

        const originalConfig = error.config;
        if (!originalConfig || (originalConfig as any).__x402retry) {
          return Promise.reject(error);
        }

        // 402 received — server sends payment requirements
        const req: PaymentRequirements = error.response.data as any;
        
        console.log("Payment requirements received:", req);

        const signReq = this.buildSignRequest(req);
        console.log("Sign request:", signReq);

        const signature = await this.signPayment(signReq);
        console.log("Signature generated:", signature);

        // Build header
        const paymentData = {
          payer: this.wallet.address,
          receiver: signReq.receiver,
          token: signReq.token,
          amount: signReq.amount,
          nonce: signReq.nonce,
          expiry: signReq.expiry,
          signature,
          version: signReq.version,
          chainId: signReq.chainId,
        };
        
        console.log("Payment data:", paymentData);

        const header = Buffer.from(JSON.stringify(paymentData)).toString("base64");
        console.log("X-PAYMENT header:", header);

        (originalConfig.headers as any)["X-PAYMENT"] = header;
        (originalConfig as any).__x402retry = true;

        console.log("Retrying request with payment...");
        return this.axios.request(originalConfig);
      }
    );
  }

  // ---------------------
  // Handle 402 Responses
  // ---------------------
  private async attachX402Header(config: any) {
    if (!config.headers) config.headers = {};

    // Do not sign if this request already includes x402-payment
    if (config.headers["x402-payment"]) return config;

    // For GET requests, just pass through - the response interceptor will handle 402
    return config;
  }

  // ---------------------
  // Build Sign Request
  // ---------------------
  private buildSignRequest(req: PaymentRequirements): SignRequest {
    const now = Math.floor(Date.now() / 1000);
    const expiry = now + (req.maxTimeoutSeconds ?? 60);
    
    // Map network to chainId
    let chainId = 84532; // Default to Base Sepolia
    if (req.network === "base-sepolia") {
      chainId = 84532;
    } else if (req.network === "base") {
      chainId = 8453;
    } else if (req.network === "ethereum") {
      chainId = 1;
    }

    return {
      chainId: chainId,
      token: req.asset,
      amount: req.maxAmountRequired,
      receiver: req.payTo,
      nonce: Date.now().toString(),
      expiry: expiry.toString(),
      version: req.scheme?.replace("x402-", "") || "1",
    };
  }

  // ---------------------
  // EIP-712 Signing
  // ---------------------
  private async signPayment(req: SignRequest): Promise<string> {
    const domain: TypedDataDomain = {
      name: "x402 Payment",
      version: req.version,
      chainId: req.chainId,
      verifyingContract: X402_VERIFIER, // IMPORTANT
    };

    const value = {
      payer: this.wallet.address,
      receiver: req.receiver,
      token: req.token,
      amount: req.amount,
      nonce: req.nonce,
      expiry: req.expiry,
    };

    return await this.wallet.signTypedData(domain, TYPES, value);
  }

  // ---------------------
  // Public Request Wrapper
  // ---------------------
  async post(url: string, data?: any, config?: any) {
    return await this.axios.post(url, data, config);
  }

  async get(url: string, config?: any) {
    return await this.axios.get(url, config);
  }
}
