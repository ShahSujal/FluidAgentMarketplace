"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Bot,
  User,
  Loader2,
  RefreshCw,
  Wallet,
  Sparkles,
} from "lucide-react";
import { executeChat, ChatStatus } from "@/actions/chat/executechat";
import { usePrivy, useWallets, useX402Fetch } from "@privy-io/react-auth";
import { toast } from "sonner";
import { createPublicClient, http, parseAbi, formatUnits } from "viem";
import { baseSepolia } from "viem/chains";
import { BrowserProvider } from "ethers";
import { ChatStatusIndicator } from "@/components/chat-status-indicator";
import { NewsGrid } from "@/components/news-card";
import { ToolUsageGrid } from "@/components/tool-usage-card";
import Image from "next/image";

interface Message {
  id: string;
  content: string;
  sender: "user" | "agent";
  timestamp: Date;
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
}

export function AgentChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [balance, setBalance] = useState<string>("0");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<ChatStatus | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { wrapFetchWithPayment } = useX402Fetch();
  const { user, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const wallet = wallets.find((w) => w.address === user?.wallet?.address);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentStatus]);

  const getUserBalance = async () => {
    if (!user?.wallet?.address) return;

    setIsRefreshing(true);
    try {
      const publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http()
      });

      const balance = await publicClient.readContract({
        address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
        abi: parseAbi(['function balanceOf(address) view returns (uint256)', 'function decimals() view returns (uint8)']),
        functionName: 'balanceOf',
        args: [user.wallet.address as `0x${string}`]
      });

      const decimals = await publicClient.readContract({
        address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
        abi: parseAbi(['function balanceOf(address) view returns (uint256)', 'function decimals() view returns (uint8)']),
        functionName: 'decimals',
      });

      // Convert to human readable format
      const balanceInUnits = formatUnits(balance, decimals);
      setBalance(parseFloat(balanceInUnits).toFixed(2));
    } catch (error) {
      console.error("Error fetching balance:", error);
      setBalance("0");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Fetch balance on mount and when address changes
  useEffect(() => {
    if (authenticated && user?.wallet?.address) {
      getUserBalance();
    } else {
      setBalance("0");
    }
  }, [authenticated, user?.wallet?.address]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    if (!authenticated) {
      toast.error("Please connect your wallet to chat");
      return;
    }

    if (!wallet) {
      toast.error("Wallet not available");
      return;
    }

    const newUserMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInputValue("");
    setIsSending(true);
    setCurrentStatus(null);

    try {
      // Convert all messages to the format expected by executeChat
      const chatMessages = [...messages, newUserMessage].map(msg => ({
        role: msg.sender === "user" ? "user" as const : "assistant" as const,
        content: msg.content,
      }));

      const provider = await wallet.getEthereumProvider();
      const browserProvider = new BrowserProvider(provider);
      const signer = await browserProvider.getSigner();

      // Execute chat with status callback
      const result = await executeChat({
        messages: chatMessages,
        wrapFetchWithPayment: wrapFetchWithPayment,
        onStatusUpdate: (status) => {
          setCurrentStatus(status);
        }
      });

      setCurrentStatus(null);

      if (result.success) {
        const agentResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: result.response,
          sender: "agent",
          timestamp: new Date(),
          toolCalls: result.toolCalls,
        };

        setMessages(prev => [...prev, agentResponse]);
        
        if (result.toolCalls && result.toolCalls.length > 0) {
          toast.success(`Executed ${result.toolCalls.length} tool(s) successfully`);
        }
      } else {
        toast.error(result.error || "Failed to get response");
        
        const errorResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: "Sorry, I encountered an error. Please try again.",
          sender: "agent",
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorResponse]);
      }
    } catch (error: any) {
      console.error("Chat error:", error);
      toast.error("Failed to send message");
      setCurrentStatus(null);
      
      const errorResponse: Message = {
        id: (Date.now() + 2).toString(),
        content: "Sorry, something went wrong. Please try again.",
        sender: "agent",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (

          <div className="flex-1 flex flex-col h-screen relative">
            {/* Background Image */}
   
          <div className="relative h-screen w-full flex flex-col ">
              
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-white/95 via-blue-50/90 to-white/95 backdrop-blur-md border-primary/10 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-linear-to-br from-blue-300 to-blue-500 text-white shadow-lg">
                      <Bot className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                </div>
                <div>
                  <h1 className="font-semibold">FluidGPT</h1>
                  <Badge variant="secondary" className="text-xs">
                    Online
                  </Badge>
                </div>
              </div>

              {/* Balance Display */}
              {authenticated && (
                <div className="flex items-center gap-2 bg-muted/50 px-3 py-2 rounded-lg">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">USDC Balance</span>
                    <span className="text-sm font-semibold">{balance}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={getUserBalance}
                    disabled={isRefreshing}
                    className="h-8 w-8 p-0 ml-2"
                  >
                    <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              )}

            </div>

            {/* Messages Area */}
            <div className="flex-1 flex flex-col">
              {messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 p-8">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary via-blue-400 to-blue-300 flex items-center justify-center shadow-2xl shadow-primary/30">
                      <Sparkles className="h-12 w-12 text-white" />
                    </div>
                    <div className="absolute inset-0 w-24 h-24 rounded-full bg-gradient-to-br from-primary via-blue-400 to-blue-300 animate-pulse opacity-20"></div>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-2xl font-semibold">Ready to Create Something New?</h2>
                    <p className="text-muted-foreground max-w-md">
                      {authenticated
                        ? "Start a conversation with FluidGPT. Ask me to check weather, perform calculations, or use any available MCP tools!"
                        : "Please connect your wallet to start chatting and using tools."}
                    </p>
                  </div>

                  {!authenticated && (
                    <Badge variant="destructive" className="text-sm">
                      Wallet not connected
                    </Badge>
                  )}
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {message.sender === "agent" && (
                        <Avatar className="h-8 w-8 mt-1 shrink-0">
                          <AvatarFallback className="bg-gradient-to-br from-primary to-blue-400 text-white text-xs shadow-md">
                            <Bot className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}

                      <div className={`max-w-[75%] ${message.sender === "user" ? "order-first" : ""}`}>
                        <div
                          className={`rounded-2xl px-4 py-3 ${message.sender === "user"
                            ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground ml-auto shadow-lg shadow-primary/20"
                            : "bg-gradient-to-br from-white/80 via-blue-50/50 to-white/80 backdrop-blur-md border border-primary/10 shadow-sm"
                            }`}
                        >
                          {/* Check if we have news to display */}
                          {(() => {
                            const hasNewsCards = message.sender === "agent" && 
                              message.toolCalls && 
                              message.toolCalls.some(call => call.resultType === 'news');
                            
                            return (
                              <>
                                {/* Only show text content if no news cards */}
                                {!hasNewsCards && (
                                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                    {message.content}
                                  </p>
                                )}
                                
                                {/* Display News Cards if available */}
                                {hasNewsCards && (
                                  <div className={message.content ? "mt-3" : ""}>
                                    {message.toolCalls
                                      ?.filter(call => call.resultType === 'news')
                                      .map((call, idx) => {
                                        // Handle different result structures
                                        let articles = [];
                                        const result = call.result;
                                        
                                        if (Array.isArray(result)) {
                                          articles = result;
                                        } else if (result?.articles) {
                                          articles = result.articles;
                                        } else if (result?.news) {
                                          articles = result.news;
                                        } else if (result?.data?.articles) {
                                          articles = result.data.articles;
                                        }
                                        
                                        // Parse articles from string format if needed
                                        if (typeof result === 'string' && result.includes('**[')) {
                                          // Parse markdown-style news items
                                          const newsItems = result.split('\n').filter(line => line.trim().startsWith('1.') || line.trim().match(/^\d+\./));
                                          articles = newsItems.map((item: string) => {
                                            const titleMatch = item.match(/\*\*\[(.*?)\]\((.*?)\)\*\*/);
                                            if (titleMatch) {
                                              const description = item.replace(/^\d+\.\s*\*\*\[.*?\]\(.*?\)\*\*\s*-?\s*/, '').trim();
                                              const dateMatch = description.match(/\(Published on (.*?)\)/);
                                              return {
                                                title: titleMatch[1],
                                                url: titleMatch[2],
                                                description: description.replace(/\(Published on .*?\)/, '').trim(),
                                                publishedAt: dateMatch ? dateMatch[1] : undefined
                                              };
                                            }
                                            return null;
                                          }).filter(Boolean);
                                        }
                                        
                                        return articles.length > 0 ? (
                                          <NewsGrid 
                                            key={idx}
                                            articles={articles}
                                            title={`Latest ${call.parameters?.topic || call.parameters?.query || 'News'}`}
                                          />
                                        ) : null;
                                      })}
                                  </div>
                                )}
                              </>
                            );
                          })()}
                          
                          {/* Tool Usage Cards */}
                          {message.toolCalls && message.toolCalls.length > 0 && (
                            <div className="mt-3">
                              <ToolUsageGrid
                                tools={message.toolCalls.map((call) => ({
                                  toolName: call.tool,
                                  mcpName: call.mcpMetadata?.name,
                                  mcpDescription: call.mcpMetadata?.description,
                                  mcpImage: call.mcpMetadata?.image,
                                  price: call.pricing?.price || 'N/A',
                                  network: call.pricing?.network || 'Unknown',
                                  rating: call.mcpMetadata?.rating,
                                  feedbackCount: call.mcpMetadata?.feedbackCount,
                                  parameters: call.parameters,
                                }))}
                              />
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 px-2">
                          {formatTime(message.timestamp)}
                        </p>
                      </div>

                      {message.sender === "user" && (
                        <Avatar className="h-8 w-8 mt-1 shrink-0">
                          <AvatarFallback className="bg-gradient-to-br from-blue-100 to-blue-50 text-primary text-xs shadow-md border border-primary/20">
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}

                  {/* Status Indicator */}
                  {currentStatus && (
                    <div className="flex gap-3">
                      <Avatar className="h-8 w-8 mt-1 shrink-0">
                        <AvatarFallback className="bg-gradient-to-br from-primary to-blue-400 text-white text-xs shadow-md">
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-gradient-to-br from-white/80 via-blue-50/50 to-white/80 backdrop-blur-md border border-primary/10 shadow-sm rounded-2xl px-4 py-3">
                        <ChatStatusIndicator status={currentStatus} />
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}

              {/* Input Area */}
              <div className="border-t bg-gradient-to-r from-white/95 via-blue-50/90 to-white/95 backdrop-blur-md p-4 border-primary/10 shadow-sm">
                <div className="relative">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={authenticated ? "Ask me anything... (e.g., What's the weather in London?)" : "Connect wallet to start chatting..."}
                    disabled={!authenticated || isSending}
                    className="pr-24 py-6 text-base rounded-2xl border-2 focus:border-primary bg-white/80 shadow-sm"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">

                    <Button
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim() || isSending || !authenticated}
                      size="sm"
                      className="h-8 w-8 p-0 rounded-full bg-gradient-to-br from-primary to-blue-500 hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 text-white"
                    >
                      {isSending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

              </div>
            </div>
          </div>
          </div>
    
  );
}