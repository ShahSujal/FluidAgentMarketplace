import { fetchAgents } from "@/lib/graphql/client";
import { Signer } from "x402-axios";
import OpenAI from "openai";
import { ExecuteTask } from "fluidsdk";

const OpenAIApiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY!;

const openai = new OpenAI({
  apiKey: OpenAIApiKey,
  dangerouslyAllowBrowser: true,
});

interface ToolPricing {
  price: string;
  network: string;
  tokens: Array<{
    address: string;
    symbol: string;
    decimals: number;
  }>;
  chainId: number;
}

interface ToolParameter {
  name: string;
  type: string;
  description: string;
  required: boolean;
  enum?: string[];
}

interface Tool {
  name: string;
  description: string;
  endpoint: string;
  parameters: ToolParameter[];
  pricing: ToolPricing;
  mcpServerUrl?: string;
}

interface IPFSMetadata {
  type: string;
  name: string;
  description: string;
  image?: string;
  creatorAddress: string;
  tools?: Tool[];
  endpoints?: Array<{
    name: string;
    endpoint: string;
    version?: string;
    mcpTools?: string[];
    mcpPrompts?: string[];
    mcpResources?: string[];
  }>;
  active: boolean;
  x402support: boolean;
  pricing?: {
    defaultPrice?: string;
    currency?: string;
    network?: string;
    token?: string;
  };
}

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ToolCall {
  toolName: string;
  parameters: Record<string, any>;
  endpoint: string;
  mcpServerUrl: string;
}

// Cache for tools to avoid fetching repeatedly
let toolsCache: Tool[] | null = null;
let toolsCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetches all available tools from registered agents
 */
const getAllTools = async (): Promise<Tool[]> => {
  // Return cached tools if available and fresh
  if (toolsCache && Date.now() - toolsCacheTime < CACHE_DURATION) {
    return toolsCache;
  }

  const agents = await fetchAgents();

  const tools: Tool[] = [];

  for (const agent of agents) {
    try {
      const ipfsUri = agent.agentURI.replace(
        "ipfs://",
        "https://ipfs.io/ipfs/"
      );
      const response = await fetch(ipfsUri);
      const metadata: IPFSMetadata = await response.json();

      if (metadata.tools && metadata.tools.length > 0) {
        // Add the MCP server URL from the agent's registration file
        const mcpServerUrl = agent.registrationFile?.mcpEndpoint || "";
        const toolsWithUrl = metadata.tools.map((tool) => ({
          ...tool,
          mcpServerUrl,
        }));
        tools.push(...toolsWithUrl);
      }
    } catch (error) {
      console.error(`Error fetching tools for agent ${agent.agentId}:`, error);
    }
  }

  toolsCache = tools;
  toolsCacheTime = Date.now();

  return tools;
};

/**
 * Converts tools to OpenRouter function calling format
 */
const convertToolsToOpenRouterFormat = (tools: Tool[]) => {
  return tools.map((tool) => ({
    type: "function" as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: {
        type: "object",
        properties: tool.parameters.reduce((acc, param) => {
          acc[param.name] = {
            type: param.type,
            description: param.description,
            ...(param.enum && { enum: param.enum }),
          };
          return acc;
        }, {} as Record<string, any>),
        required: tool.parameters.filter((p) => p.required).map((p) => p.name),
      },
    },
  }));
};

/**
 * Extracts text content from message content that might be string or array
 */
const getMessageContent = (content: any): string => {
  if (typeof content === "string") {
    return content;
  }
  if (Array.isArray(content)) {
    // Extract text from content array
    return content
      .filter((item) => item.type === "text")
      .map((item) => item.text)
      .join(" ");
  }
  return "";
};

/**
 * Executes a tool call using the x402 payment system
 */
const executeToolCall = async (
  tool: Tool,
  parameters: Record<string, any>,
  signer: Signer
) => {
  if (!tool.mcpServerUrl) {
    throw new Error(`No MCP server URL found for tool: ${tool.name}`);
  }

  // Remove duplicate /mcp prefix from endpoint if it exists
  let endpoint = tool.endpoint;
  if (endpoint.startsWith('/mcp/') && tool.mcpServerUrl.endsWith('/mcp')) {
    endpoint = endpoint.replace('/mcp', '');
  }

  
  const execute = new ExecuteTask();

  const result = await execute.executeAgentTask({
    agentEndpoint: endpoint,
    mcpServerUrl: tool.mcpServerUrl,
    parameters,
    signer,
  });

  return result;
};

/**
 * Main chat execution function that handles user queries with tool calling
 */
export async function executeChat({
  messages,
  signer,
  agentId,
}: {
  messages: ChatMessage[];
  signer: Signer;
  agentId?: string;
}): Promise<{
  success: boolean;
  response: string;
  toolCalls?: Array<{
    tool: string;
    parameters: Record<string, any>;
    result: any;
  }>;
  error?: string;
}> {
  try {
    // Fetch available tools
    const allTools = await getAllTools();

    // Filter tools by agentId if provided
    const availableTools = agentId
      ? allTools.filter((tool) => tool.mcpServerUrl?.includes(agentId))
      : allTools;

    if (availableTools.length === 0) {
      return {
        success: false,
        response: "No tools available for this agent.",
        error: "No tools found",
      };
    }

    // Convert tools to OpenAI format
    const openAITools = availableTools.map((tool) => ({
      type: "function" as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: {
          type: "object",
          properties: tool.parameters.reduce((acc, param) => {
            acc[param.name] = {
              type: param.type,
              description: param.description,
              ...(param.enum && { enum: param.enum }),
            };
            return acc;
          }, {} as Record<string, any>),
          required: tool.parameters.filter((p) => p.required).map((p) => p.name),
        },
      },
    }));

    // Create system message
    const systemMessage = {
      role: "system" as const,
      content: `You are a helpful AI assistant that can chat naturally and use tools when needed.

Available tools: ${availableTools.map((t) => `${t.name} - ${t.description}`).join(", ")}

Guidelines:
- For casual greetings or general questions, respond naturally without using tools
- Only use tools when the user explicitly requests something that requires them
- Extract accurate parameters from the user's message
- Be friendly and conversational`,
    };

    const allMessages = [systemMessage, ...messages];

    // First API call - determine if tools are needed
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: allMessages,
      tools: openAITools,
      tool_choice: "auto",
    });

    const assistantMessage = completion.choices[0].message;
    const toolCallsExecuted: Array<{
      tool: string;
      parameters: Record<string, any>;
      result: any;
    }> = [];

    // Check if tools were called
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      console.log("🔧 Tool calls requested:", assistantMessage.tool_calls);

      // Execute all tool calls
      for (const toolCall of assistantMessage.tool_calls) {
        if (toolCall.type !== "function") continue;
        
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);

        console.log(`Executing tool: ${functionName}`, functionArgs);

        // Find the tool definition
        const tool = availableTools.find((t) => t.name === functionName);
        if (!tool) {
          console.error(`Tool not found: ${functionName}`);
          continue;
        }

        try {
          // Execute the tool via x402
          const result = await executeToolCall(tool, functionArgs, signer);

          toolCallsExecuted.push({
            tool: functionName,
            parameters: functionArgs,
            result: result,
          });

          console.log(`✅ Tool ${functionName} executed successfully:`, result);
        } catch (error: any) {
          console.error(`❌ Error executing tool ${functionName}:`, error);
          toolCallsExecuted.push({
            tool: functionName,
            parameters: functionArgs,
            result: { error: error.message },
          });
        }
      }

      // Second API call - incorporate tool results
      const toolMessages = assistantMessage.tool_calls.map((tc, index) => ({
        role: "tool" as const,
        tool_call_id: tc.id,
        content: JSON.stringify(toolCallsExecuted[index].result),
      }));

      const finalCompletion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          ...allMessages,
          assistantMessage,
          ...toolMessages,
        ],
      });

      return {
        success: true,
        response: finalCompletion.choices[0].message.content || "",
        toolCalls: toolCallsExecuted,
      };
    }

    // No tools needed, return direct response
    return {
      success: true,
      response: assistantMessage.content || "I couldn't generate a response.",
    };
  } catch (error: any) {
    console.error("Error executing chat:", error);
    return {
      success: false,
      response: "Sorry, I encountered an error processing your request.",
      error: error.message,
    };
  }
}

/**
 * Get available tools for display in the UI
 */
export async function getAvailableTools(agentId?: string): Promise<Tool[]> {
  const allTools = await getAllTools();

  if (agentId) {
    return allTools.filter((tool) => tool.mcpServerUrl?.includes(agentId));
  }

  return allTools;
}
