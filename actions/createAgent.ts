"use server"
import { ethers } from "ethers";
import {FluidSDK} from "fluidsdk"
import { getDeatailsByChainId } from "../lib/helpers/getDetailsByChainId";

export const createAgentScript = async ({
    MCP_SERVER_URL,
    MCP_PROTOCOL_VERSION,
    agentName,
    agentDescription,
    agentImage,
    chainId,
    agentWalletAddress,
    category
}:{
    MCP_SERVER_URL: string;
    MCP_PROTOCOL_VERSION: string;
    agentName: string;
    agentDescription: string;
    agentImage: string;
    chainId: number;
    agentWalletAddress: string;
    category: string[]
})=>{
  try {
      const PRIVATE_KEY = process.env.PRIVATE_KEY;
      const PINATA_JWT =  process.env.PINATA_JWT;

    if (!PRIVATE_KEY) {
        throw new Error("PRIVATE_KEY environment variable is not set");
    }
    if (!PINATA_JWT) {
        throw new Error("PINATA_JWT environment variable is not set");
    }
     // Create signers
    const signer = new ethers.Wallet(PRIVATE_KEY!);
    const details = getDeatailsByChainId(chainId);

    if (!details) {
        throw new Error(`No details found for chainId ${chainId}`);
    }
    
    const sdk = new FluidSDK({
        rpcUrl: details.rpc,
        chainId: parseInt(details.chainId),
        pinataJwt: PINATA_JWT!,
        signer: signer,
        ipfs: "pinata"
    });
    

    const agent = sdk.createAgent({
      name: agentName,
      description: agentDescription,
      image: agentImage,
      x402support: true,
      metadata: {category: category},
      active: true,
      owners: [signer.address as `0x${string}`],
    });


    const tools = await fetch(`${MCP_SERVER_URL}/tools`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }).then((res) => res.json());

    const resources = await fetch(`${MCP_SERVER_URL}/resources`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }).then((res) => res.json());
    const prompts = await fetch(`${MCP_SERVER_URL}/prompts`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }).then((res) => res.json());

    await agent.setMCP(MCP_SERVER_URL, MCP_PROTOCOL_VERSION, true);

    if (tools.length > 0 || prompts.length > 0 || resources.length > 0) {
      const toolNames = tools.map((item:any) => item.name);
      const promptNames = prompts.map((item:any) => item.name);
      const resourceNames = resources.map((item:any) =>  JSON.stringify(item));
      agent.setMcpCapabilities(toolNames, promptNames, resourceNames);
    }

    agent.setAgentWallet(agentWalletAddress, parseInt(details.chainId));
    if (!sdk.ipfsClient) {
      throw new Error("IPFS client not configured - cannot register agent");
    }
    const registrationFile = await agent.registerIPFS();

    // Fetch and display the actual IPFS content
    const ipfsCid = registrationFile.agentURI?.replace("ipfs://", "");
    if (ipfsCid) {
      try {
        const ipfsUrl = `https://salmon-quiet-marten-958.mypinata.cloud/ipfs/${ipfsCid}`;
        console.log({ipfsUrl});
        
        const ipfsResponse = await fetch(ipfsUrl);
        if (ipfsResponse.ok) {
          const ipfsContent = await ipfsResponse.json();
          const mcpEndpoint = ipfsContent.endpoints?.find(
            (e: any) => e.name === "MCP" || e.name === "mcp"
          );
          if (mcpEndpoint) {
            if (mcpEndpoint.mcpTools) {
              console.log(`   Tool list: ${mcpEndpoint.mcpTools.join(", ")}`);
            }
          } else {
            console.log("⚠️  No MCP endpoint found in IPFS content");
          }
        }
      } catch (error) {
        console.log(
          "⚠️  Could not fetch IPFS content:",
          error instanceof Error ? error.message : String(error)
        );
      }
    }

    const newAgentId = registrationFile.agentId;
    console.log(" agent id", newAgentId);
    
    if (!newAgentId) {
      throw new Error("Registration failed - no agent ID returned");
    }
    return newAgentId;
  } catch (error) {
    
    console.error("Error creating agent:", error instanceof Error ? error.message : String(error));
    throw error;
  }
}