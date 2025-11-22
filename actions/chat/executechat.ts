import { fetchAgents } from "@/lib/graphql/client";
import { Signer } from "x402-axios";
import OpenAI from "openai";
import { ExecuteTask } from "fluidsdk";
import { WrapFetchWithPayment } from "@privy-io/react-auth";
import { executeTask } from "@/lib/scripts/execute";

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

export type ChatStatus = 
  | { stage: "thinking"; message: string; detail?: string }
  | { stage: "tool_search"; message: string; toolsFound?: number; detail?: string }
  | { stage: "tool_call"; message: string; toolName: string; price: string; network: string; detail?: string }
  | { stage: "tool_execute"; message: string; toolName: string; progress?: string }
  | { stage: "tool_success"; message: string; toolName: string; result?: any }
  | { stage: "processing"; message: string; detail?: string }
  | { stage: "formatting"; message: string; detail?: string }
  | { stage: "streaming"; message: string; content: string }
  | { stage: "complete"; message: string }
  | { stage: "error"; message: string; error: string };

export type StatusCallback = (status: ChatStatus) => void;

// Helper to parse and structure tool results
export function parseToolResult(toolName: string, result: any): {
  type: 'news' | 'weather' | 'search' | 'generic';
  data: any;
} {
  // Check if result contains news-like data
  if (toolName.toLowerCase().includes('news') || toolName.toLowerCase().includes('get_news')) {
    // Handle different news data structures
    let articles = [];
    
    if (Array.isArray(result)) {
      articles = result;
    } else if (result?.articles) {
      articles = result.articles;
    } else if (result?.news) {
      articles = result.news;
    } else if (result?.data?.articles) {
      articles = result.data.articles;
    } else if (typeof result === 'string') {
      // Try to parse string response
      try {
        const parsed = JSON.parse(result);
        articles = parsed.articles || parsed.news || [];
      } catch {
        // If it's a formatted string, return it as generic
        return { type: 'generic', data: result };
      }
    }
    
    // Parse articles to ensure they have the right structure
    const parsedArticles = articles.map((article: any) => {
      if (typeof article === 'string') {
        // Try to extract title and URL from markdown format
        const titleMatch = article.match(/\*\*\[(.*?)\]\((.*?)\)\*\*/);
        if (titleMatch) {
          return {
            title: titleMatch[1],
            url: titleMatch[2],
            description: article.replace(/\*\*\[(.*?)\]\((.*?)\)\*\*/, '').trim()
          };
        }
        return { title: article, description: '' };
      }
      return {
        title: article.title || article.headline || 'Untitled',
        url: article.url || article.link,
        description: article.description || article.snippet || article.summary,
        publishedAt: article.publishedAt || article.published_at || article.date,
        source: article.source?.name || article.source
      };
    });
    
    return {
      type: 'news',
      data: parsedArticles
    };
  }
  
  // Check for weather data
  if (toolName.toLowerCase().includes('weather') || result?.temperature !== undefined) {
    return {
      type: 'weather',
      data: result
    };
  }
  
  // Check for search results
  if (toolName.toLowerCase().includes('search') || Array.isArray(result?.results)) {
    return {
      type: 'search',
      data: result?.results || result
    };
  }
  
  return {
    type: 'generic',
    data: result
  };
}

// Cache for tools to avoid fetching repeatedly
let toolsCache: Tool[] | null = null;
let toolsCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetches all available tools from registered agents
 */
// Cache for agent metadata
let agentMetadataCache: Map<string, any> = new Map();

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

      // Cache agent metadata for later use
      const mcpServerUrl = agent.registrationFile?.mcpEndpoint || "";
      if (mcpServerUrl) {
        // Calculate average rating from feedback
        let averageRating = 0;
        if (agent.feedback && agent.feedback.length > 0) {
          const totalScore = agent.feedback.reduce((sum, f) => sum + (f.score || 0), 0);
          averageRating = totalScore / agent.feedback.length;
        }

        agentMetadataCache.set(mcpServerUrl, {
          name: agent.registrationFile?.name || metadata.name,
          description: agent.registrationFile?.description || metadata.description,
          image: agent.registrationFile?.image || metadata.image,
          rating: averageRating,
          feedbackCount: agent.feedback?.length || 0,
        });
      }

      if (metadata.tools && metadata.tools.length > 0) {
        // Add the MCP server URL from the agent's registration file
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
  wrapFetchWithPayment: WrapFetchWithPayment
) => {
  if (!tool.mcpServerUrl) {
    throw new Error(`No MCP server URL found for tool: ${tool.name}`);
  }

  // Remove duplicate /mcp prefix from endpoint if it exists
  let endpoint = tool.endpoint;
  // if (endpoint.startsWith('/mcp/') && tool.mcpServerUrl.endsWith('/mcp')) {
    endpoint = endpoint.replace('/mcp', '');
  // }

  const result = await executeTask({
    endpoint: endpoint,
    mcpServerUrl: tool.mcpServerUrl,
    parameters,
    wrapFetchWithPayment,
  });

  return result;
};

/**
 * Main chat execution function that handles user queries with tool calling
 */
export async function executeChat({
  messages,
  wrapFetchWithPayment,
  agentId,
  onStatusUpdate,
}: {
  messages: ChatMessage[];
  wrapFetchWithPayment: WrapFetchWithPayment;
  agentId?: string;
  onStatusUpdate?: StatusCallback;
}): Promise<{
  success: boolean;
  response: string;
  toolCalls?: Array<{
    tool: string;
    parameters: Record<string, any>;
    result: any;
    resultType?: 'news' | 'weather' | 'search' | 'generic';
    mcpMetadata?: {
      name: string;
      description?: string;
      image?: string;
      rating?: number;
      feedbackCount?: number;
    };
    pricing?: {
      price: string;
      network: string;
    };
  }>;
  error?: string;
}> {
  try {
    // Send initial thinking status
    onStatusUpdate?.({
      stage: "thinking",
      message: "Analyzing your request...",
      detail: "Understanding context and intent"
    });

    // Fetch available tools
    onStatusUpdate?.({
      stage: "tool_search",
      message: "Searching for available tools...",
      detail: "Checking registered MCP servers"
    });

    const allTools = await getAllTools();

    // Filter tools by agentId if provided
    const availableTools = agentId
      ? allTools.filter((tool) => tool.mcpServerUrl?.includes(agentId))
      : allTools;

    onStatusUpdate?.({
      stage: "tool_search",
      message: `Found ${availableTools.length} available tools`,
      toolsFound: availableTools.length,
      detail: availableTools.length > 0 ? availableTools.slice(0, 3).map(t => t.name).join(", ") + (availableTools.length > 3 ? "..." : "") : "No tools available"
    });

    if (availableTools.length === 0) {
      onStatusUpdate?.({
        stage: "error",
        message: "No tools available",
        error: "No tools found"
      });
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

    onStatusUpdate?.({
      stage: "processing",
      message: "Processing with AI model...",
      detail: "Determining if tools are needed"
    });

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
      resultType?: 'news' | 'weather' | 'search' | 'generic';
      mcpMetadata?: {
        name: string;
        description?: string;
        image?: string;
        rating?: number;
        feedbackCount?: number;
      };
      pricing?: {
        price: string;
        network: string;
      };
    }> = [];

    // Check if tools were called
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      console.log("🔧 Tool calls requested:", assistantMessage.tool_calls);

      // Execute all tool calls
      for (const toolCall of assistantMessage.tool_calls) {
        if (toolCall.type !== "function") continue;
        
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);

        // Find the tool definition
        const tool = availableTools.find((t) => t.name === functionName);
        if (!tool) {
          console.error(`Tool not found: ${functionName}`);
          continue;
        }

        // Send tool call status with price
        onStatusUpdate?.({
          stage: "tool_call",
          message: `Preparing to call ${functionName}`,
          toolName: functionName,
          price: tool.pricing.price,
          network: tool.pricing.network,
          detail: `Parameters: ${Object.keys(functionArgs).join(", ")}`
        });

        console.log(`Executing tool: ${functionName}`, functionArgs);

        try {
          // Send tool execute status
          onStatusUpdate?.({
            stage: "tool_execute",
            message: `Executing ${functionName}...`,
            toolName: functionName,
            progress: "Sending request to MCP server"
          });

          // Execute the tool via x402
          const result = await executeToolCall(tool, functionArgs, wrapFetchWithPayment);

          // Parse the result to determine its type
          const parsedResult = parseToolResult(functionName, result);

          // Get MCP metadata from cache
          const mcpMetadata = tool.mcpServerUrl ? agentMetadataCache.get(tool.mcpServerUrl) : undefined;

          onStatusUpdate?.({
            stage: "tool_success",
            message: `Successfully executed ${functionName}`,
            toolName: functionName,
            result: parsedResult
          });

          toolCallsExecuted.push({
            tool: functionName,
            parameters: functionArgs,
            result: result,
            resultType: parsedResult.type,
            mcpMetadata,
            pricing: {
              price: tool.pricing.price,
              network: tool.pricing.network,
            },
          });

          console.log(`✅ Tool ${functionName} executed successfully:`, result);
        } catch (error: any) {
          console.error(`❌ Error executing tool ${functionName}:`, error);
          
          // Get MCP metadata even for failed calls
          const mcpMetadata = tool.mcpServerUrl ? agentMetadataCache.get(tool.mcpServerUrl) : undefined;
          
          toolCallsExecuted.push({
            tool: functionName,
            parameters: functionArgs,
            result: { error: error.message },
            resultType: 'generic',
            mcpMetadata,
            pricing: {
              price: tool.pricing.price,
              network: tool.pricing.network,
            },
          });
        }
      }

      // Send processing status
      onStatusUpdate?.({
        stage: "processing",
        message: "Generating response with tool results...",
        detail: `Processing ${toolCallsExecuted.length} tool result(s)`
      });

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

      const finalResponse = finalCompletion.choices[0].message.content || "";

      onStatusUpdate?.({
        stage: "formatting",
        message: "Formatting response...",
        detail: "Preparing final output"
      });

      onStatusUpdate?.({
        stage: "complete",
        message: "Response ready"
      });

      return {
        success: true,
        response: finalResponse,
        toolCalls: toolCallsExecuted,
      };
    }

    // No tools needed, return direct response
    onStatusUpdate?.({
      stage: "complete",
      message: "Response ready"
    });

    return {
      success: true,
      response: assistantMessage.content || "I couldn't generate a response.",
    };
  } catch (error: any) {
    console.error("Error executing chat:", error);
    
    onStatusUpdate?.({
      stage: "error",
      message: "An error occurred",
      error: error.message
    });

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
