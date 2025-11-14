import { createAgentScript } from "@/actions/createAgent";

export const createAgentPayload = async ({
    agentName,
    agentDescription,
    MCP_SERVER_URL,
    MCP_PROTOCOL_VERSION,
    chainId,
    agentWalletAddress,
    category,
    agentImage
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
    const status = createAgentScript({
        MCP_SERVER_URL,
        MCP_PROTOCOL_VERSION,
        agentName,
        agentDescription,
        agentImage,
        chainId,
        agentWalletAddress,
        category
    });
    return status;
}