# AI Chat Layer with Tool Execution

This module provides an intelligent chat layer that can understand user queries and automatically execute the appropriate MCP tools with x402 payment handling.

## Features

- 🤖 **Natural Language Understanding**: Uses GPT-4 to understand user intent
- 🔧 **Automatic Tool Selection**: Identifies and calls the right tools based on context
- 💰 **x402 Payment Integration**: Handles micropayments seamlessly
- 📊 **Tool Parameter Inference**: Extracts or infers parameters from user messages
- 🔄 **Multi-tool Support**: Can execute multiple tools in a single conversation

## How It Works

1. **Tool Discovery**: Fetches all available tools from registered agents
2. **Intent Analysis**: LLM analyzes user query to determine if tools are needed
3. **Parameter Extraction**: Automatically extracts or infers required parameters
4. **Tool Execution**: Calls tools via x402 payment protocol
5. **Response Generation**: Incorporates tool results into natural language response

## Usage Example

```typescript
import { executeChat } from "@/actions/chat/executechat";
import { walletClientToSigner } from "@/lib/scripts/walletClient";
import { useWalletClient } from "wagmi";

// In your component
const { data: walletClient } = useWalletClient();
const signer = walletClientToSigner(walletClient);

// Execute a chat query
const result = await executeChat({
  messages: [
    {
      role: "user",
      content: "What's the weather in New York?",
    },
  ],
  signer: signer,
  agentId: "optional-agent-id", // Filter tools by specific agent
});

console.log(result.response); // "The weather in New York is..."
console.log(result.toolCalls); // Array of executed tools with results
```

## Example User Queries

### Weather Query
```
User: "What's the weather today in London?"
```
The system will:
- Identify the `weather` tool
- Extract parameters: `location: "London"`
- Call the weather API via x402
- Return formatted weather information

### Mathematical Calculation
```
User: "What's 45 multiplied by 23?"
```
The system will:
- Identify the `calculate` tool
- Extract parameters: `operation: "multiply", a: 45, b: 23`
- Execute the calculation
- Return the result: "45 × 23 = 1035"

### Complex Multi-step Query
```
User: "Calculate 100 + 50, then tell me the weather"
```
The system will:
- Execute multiple tool calls
- Combine results intelligently
- Provide a comprehensive response

## API Reference

### `executeChat(params)`

Main function to execute chat with tool calling.

**Parameters:**
```typescript
{
  messages: ChatMessage[],  // Conversation history
  signer: Signer,            // x402 payment signer
  agentId?: string           // Optional: filter tools by agent
}
```

**Returns:**
```typescript
{
  success: boolean,
  response: string,          // Natural language response
  toolCalls?: Array<{        // Optional: tools that were executed
    tool: string,
    parameters: Record<string, any>,
    result: any
  }>,
  error?: string             // Optional: error message
}
```

### `getAvailableTools(agentId?: string)`

Get list of available tools for display in UI.

**Parameters:**
- `agentId` (optional): Filter tools by specific agent

**Returns:**
- `Tool[]`: Array of available tools with metadata

## Tool Format

Tools are automatically discovered from agent metadata:

```typescript
{
  name: "calculate",
  description: "Perform basic mathematical calculations",
  endpoint: "/mcp/calculate",
  parameters: [
    {
      name: "operation",
      type: "string",
      description: "The mathematical operation",
      required: true,
      enum: ["add", "subtract", "multiply", "divide"]
    },
    {
      name: "a",
      type: "number",
      description: "First number",
      required: true
    },
    {
      name: "b",
      type: "number",
      description: "Second number",
      required: true
    }
  ],
  pricing: {
    price: "$0.001",
    network: "base-sepolia",
    tokens: [
      {
        address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
        symbol: "USDC",
        decimals: 6
      }
    ],
    chainId: 84532
  }
}
```

## Integration with Chat UI

```typescript
"use client"

import { useState } from "react";
import { executeChat } from "@/actions/chat/executechat";
import { walletClientToSigner } from "@/lib/scripts/walletClient";
import { useWalletClient } from "wagmi";

export function ChatComponent() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const { data: walletClient } = useWalletClient();

  const sendMessage = async () => {
    const userMessage = { role: "user", content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);

    const signer = walletClientToSigner(walletClient);
    
    const result = await executeChat({
      messages: updatedMessages,
      signer: signer,
    });

    if (result.success) {
      setMessages([
        ...updatedMessages,
        { role: "assistant", content: result.response }
      ]);
    }
  };

  return (
    // Your chat UI here
  );
}
```

## Caching

The system automatically caches tool definitions for 5 minutes to reduce unnecessary API calls and improve performance.

## Error Handling

All errors are caught and logged. The system will:
- Return user-friendly error messages
- Continue operation even if individual tools fail
- Provide fallback responses when tools are unavailable

## Payment Flow

1. User sends query
2. LLM identifies required tool(s)
3. For each tool:
   - Initial request returns 402 Payment Required
   - x402 interceptor handles USDC payment
   - Request retries with payment proof
   - Tool returns result
4. Results incorporated into final response

## Notes

- Requires connected wallet with USDC balance
- Payment amounts defined per tool in agent metadata
- All transactions on Base Sepolia testnet (for development)
- OpenRouter API key required for LLM functionality
