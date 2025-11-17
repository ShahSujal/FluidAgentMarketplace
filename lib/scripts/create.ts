import { createAgentScript } from "@/actions/createAgent";
import { executeTask } from "@/actions/executeTask";
import { performOperation } from "@/actions/pay";
import { callMCP } from "@/actions/test/call";
import { ethers } from "ethers";

export const createAgentPayload = async ({
  agentName,
  agentDescription,
  MCP_SERVER_URL,
  MCP_PROTOCOL_VERSION,
  chainId,
  agentWalletAddress,
  category,
  agentImage,
}: {
  MCP_SERVER_URL: string;
  MCP_PROTOCOL_VERSION: string;
  agentName: string;
  agentDescription: string;
  agentImage: string;
  chainId: number;
  agentWalletAddress: string;
  category: string[];
}) => {
  const status = createAgentScript({
    MCP_SERVER_URL,
    MCP_PROTOCOL_VERSION,
    agentName,
    agentDescription,
    agentImage,
    chainId,
    agentWalletAddress,
    category,
  });
  return status;
};

export const makePayment = async () => {
  console.log("Making payment...");
  
  try {
    const signer = new ethers.Wallet(
      "PRIVATE KEY HERE"
    );
    
    console.log("Signer created successfully");
    
    const result = await performOperation({
      endpoint: "/weather",
      mcpServerUrl: "https://fluidmcpserver.vercel.app/mcp",
      parameters: { location: "New York", unit: "celsius" },
      signer,
    });
    
    return result;
   
  } catch (error) {
    console.error("Payment error:", error);
    throw error;
  }
};

export const executeTrialOperation = async ({
  endpoint,
  mcpServerUrl,
  parameters,
  privateKey,
}: {
  endpoint: string;
  mcpServerUrl: string;
  parameters: Record<string, any>;
  privateKey?: string;
}) => {
  console.log("Executing trial operation...", { endpoint, parameters });
  
  try {
    // Use provided private key or default one for trial
    const signerKey ="PRIVATE KEY HERE";
    const signer = new ethers.Wallet(signerKey);
    // Use the new callMCP function with proper 402 handling
    const result = await callMCP({
      endpoint,
      signer,
      params: parameters,
      mcpUrl: mcpServerUrl,
    });
    
    return result;
   
  } catch (error) {
    console.error("Trial operation error:", error);
    throw error;
  }
};
