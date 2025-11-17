import axios, { AxiosInstance } from "axios";
import { with402Interceptor } from "./interceptor";
import { ethers } from "ethers";

interface CallMCPParams {
  endpoint: string;
  signer: ethers.Wallet;
  params: Record<string, any>;
  mcpUrl: string;
}

export async function callMCP({ endpoint, signer, params, mcpUrl }: CallMCPParams) {
  console.log("🚀 Starting MCP call:", { endpoint, params, mcpUrl });
  
  const api: AxiosInstance = with402Interceptor(
    axios.create({ baseURL: mcpUrl }),
    signer
  );

  const res = await api.get(endpoint, {
    params
  });

  console.log("✅ MCP call response:", res.data);
  return res.data;
}
