# FluidGPT Chat Examples

## How to Use the AI Chat

The FluidGPT chat interface provides an intelligent layer that can understand natural language and execute MCP tools automatically with payment handling via x402 protocol.

### Prerequisites
- Connect your wallet (Reown/WalletConnect)
- Have USDC balance on Base Sepolia testnet
- Available MCP tools registered in the marketplace

## Example Queries

### 1. Weather Information
```
User: "What's the weather in New York?"
User: "Check the weather in London with celsius"
User: "Tell me the temperature in Tokyo"
```

**What happens:**
- AI identifies the `weather` tool
- Extracts location parameter: "New York", "London", "Tokyo"
- Infers unit preference (celsius/fahrenheit)
- Executes API call with x402 payment
- Returns formatted weather data

### 2. Mathematical Calculations
```
User: "What's 45 multiplied by 23?"
User: "Calculate 100 + 50"
User: "Divide 1000 by 25"
User: "What's 2 to the power of 10?"
```

**What happens:**
- AI identifies the `calculate` tool
- Extracts operation type and numbers
- Executes calculation with payment
- Returns result in natural language

### 3. Multi-step Queries
```
User: "Calculate 100 * 5, then tell me if that's more than 400"
User: "What's the weather in Paris and London?"
User: "Add 50 to 100, then divide by 3"
```

**What happens:**
- AI executes multiple tool calls in sequence
- Combines results intelligently
- Provides comprehensive answer

### 4. Conversational Context
```
User: "What's the weather in Boston?"
AI: "The weather in Boston is sunny, 72°F..."

User: "What about tomorrow?"
AI: [Remembers we're talking about Boston weather]

User: "And what's it like in Seattle?"
AI: [Switches context to Seattle]
```

**Context Handling:**
- Full conversation history is maintained
- AI remembers previous queries
- Can reference earlier messages
- Natural conversation flow

## Tool Execution Flow

1. **User sends message** → "What's the weather in London?"
2. **AI analyzes intent** → Needs weather tool
3. **AI extracts parameters** → `{location: "London", unit: "celsius"}`
4. **Payment initiated** → x402 sends USDC payment
5. **Tool executes** → Weather API called
6. **Result incorporated** → "The weather in London is cloudy, 15°C..."
7. **Response displayed** → Natural language answer with tool details

## Features

### ✅ Automatic Tool Detection
- No need to specify tool names
- AI understands natural language
- Handles multiple tools per query

### ✅ Parameter Inference
- Extracts data from context
- Smart defaults for optional parameters
- Validates required fields

### ✅ Payment Handling
- Automatic x402 payment
- USDC transactions on Base Sepolia
- Payment proof handling
- Transaction confirmation

### ✅ Conversation Memory
- Full chat history maintained
- Context-aware responses
- Follow-up questions supported
- Previous results referenced

### ✅ Visual Feedback
- Tool execution indicators
- Parameter details shown
- Payment confirmations
- Error messages

## Tips for Best Results

### Be Specific
❌ "Weather"
✅ "What's the weather in Paris?"

### Natural Language
❌ `calculate({operation: "add", a: 5, b: 10})`
✅ "What's 5 plus 10?"

### Follow-up Questions
✅ "And what about New York?" (after asking about weather)
✅ "Can you double that?" (after a calculation)

### Multiple Tools
✅ "Calculate 50 * 2 and check the weather in Tokyo"
✅ "What's 100 + 50, and is that number even?"

## Technical Details

### Model
- **Free Model**: `google/gemini-2.0-flash-exp:free`
- **Provider**: OpenRouter API
- **Function Calling**: Native tool support

### Payment
- **Protocol**: x402 payment required
- **Currency**: USDC
- **Network**: Base Sepolia (testnet)
- **Token**: 0x036CbD53842c5426634e7929541eC2318f3dCF7e

### Context Handling
- All previous messages sent to AI
- Full conversation history maintained
- Stateless server (context in messages)
- No session storage required

## Troubleshooting

### "Please connect your wallet"
→ Click the wallet connect button in the header

### "Failed to get response"
→ Check wallet connection and USDC balance

### "No tools available"
→ Ensure MCP agents are registered in the marketplace

### Tool execution failed
→ Check payment was successful
→ Verify tool endpoint is accessible
→ Review tool parameters in details dropdown

## Example Conversation

```
User: Hi! Can you help me?

AI: Hello! Yes, I'm FluidGPT. I can help you with weather information, 
calculations, and other tools available in the marketplace. What would 
you like to know?

User: What's the weather in San Francisco?

AI: Let me check that for you.
[Tool: weather executed]
The weather in San Francisco is partly cloudy with a temperature of 
65°F (18°C). There's a light breeze from the west at 8 mph.

User: That sounds nice! What's 65 in celsius?

AI: Let me calculate that.
[Tool: calculate executed]
65°F is approximately 18.3°C. (Actually I already mentioned it was 18°C!)

User: Oh right! Thanks!

AI: You're welcome! Is there anything else I can help you with?
```

## Advanced Usage

### Custom Agent Filtering
```typescript
// Filter tools by specific agent
const result = await executeChat({
  messages: chatMessages,
  signer: signer,
  agentId: "specific-agent-id" // Only use this agent's tools
});
```

### Programmatic Access
```typescript
import { executeChat } from "@/actions/chat/executechat";

const result = await executeChat({
  messages: [
    { role: "user", content: "What's the weather in Tokyo?" }
  ],
  signer: yourSigner,
});

console.log(result.response);
console.log(result.toolCalls);
```

## Notes

- First message may take longer (tool discovery)
- Subsequent messages use cached tools (5min cache)
- Each tool execution costs gas + tool fee
- Tool results shown in expandable sections
- Full conversation history preserved per session
