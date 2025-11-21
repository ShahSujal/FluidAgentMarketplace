"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Paperclip,
  Settings,
  Upload,
  Sparkles,
  Bot,
  User,
  Loader2,
  RefreshCw,
  Wallet,
  ExternalLink
} from "lucide-react";
import { Signer } from "fluidsdk";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { executeChat } from "@/actions/chat/executechat";
import { usePrivy, useWallets, useX402Fetch } from "@privy-io/react-auth";
import { toast } from "sonner";
import { createPublicClient, http, parseAbi, formatUnits } from "viem";
import { baseSepolia } from "viem/chains";
import { BrowserProvider } from "ethers";

interface Message {
  id: string;
  content: string;
  sender: "user" | "agent";
  timestamp: Date;
  toolCalls?: Array<{
    tool: string;
    parameters: Record<string, any>;
    result: any;
  }>;
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

export function AgentChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [balance, setBalance] = useState<string>("0");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { wrapFetchWithPayment } = useX402Fetch();

  const { user, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const wallet = wallets.find((w) => w.address === user?.wallet?.address);

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

  const quickActions: QuickAction[] = [];

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
    setIsTyping(true);
    setIsSending(true);

    try {
      // Convert all messages to the format expected by executeChat
      const chatMessages = [...messages, newUserMessage].map(msg => ({
        role: msg.sender === "user" ? "user" as const : "assistant" as const,
        content: msg.content,
      }));

      const provider = await wallet.getEthereumProvider();
      const browserProvider = new BrowserProvider(provider);
      const signer = await browserProvider.getSigner();

      // Execute chat with full conversation history
      const result = await executeChat({
        messages: chatMessages,
        wrapFetchWithPayment: wrapFetchWithPayment
      });

      if (result.success) {
        const agentResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: result.response,
          sender: "agent",
          timestamp: new Date(),
          toolCalls: result.toolCalls,
        };

        setMessages(prev => [...prev, agentResponse]);

        // Show success toast if tools were used
        if (result.toolCalls && result.toolCalls.length > 0) {
          toast.success(`Executed ${result.toolCalls.length} tool(s)`);
        }
      } else {
        toast.error(result.error || "Failed to get response");

        // Add error message
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

      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, something went wrong. Please try again.",
        sender: "agent",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
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
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex h-screen ">
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-linear-to-r from-purple-500 to-blue-500 text-white">
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
                    <div className="w-24 h-24 rounded-full bg-linear-to-br from-purple-500 via-blue-500 to-indigo-500 flex items-center justify-center shadow-2xl">
                      <Sparkles className="h-12 w-12 text-white" />
                    </div>
                    <div className="absolute inset-0 w-24 h-24 rounded-full bg-linear-to-br from-purple-500 via-blue-500 to-indigo-500 animate-pulse opacity-20"></div>
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

                  {/* Quick Actions */}
                  {authenticated && quickActions.length > 0 && (
                    <div className="grid grid-cols-3 gap-4 w-full max-w-2xl">
                      {quickActions.map((action) => (
                        <Card
                          key={action.id}
                          className="p-4 hover:shadow-lg transition-all cursor-pointer border-dashed hover:border-solid hover:border-primary"
                          onClick={() => setInputValue(`Help me ${action.label.toLowerCase()}`)}
                        >
                          <div className="flex flex-col items-center text-center space-y-2">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                              {action.icon}
                            </div>
                            <div>
                              <h3 className="font-medium text-sm">{action.label}</h3>
                              <p className="text-xs text-muted-foreground">{action.description}</p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
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
                        <Avatar className="h-8 w-8 mt-1">
                          <AvatarFallback className="bg-linear-to-r from-purple-500 to-blue-500 text-white text-xs">
                            <Bot className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}

                      <div className={`max-w-[75%] ${message.sender === "user" ? "order-first" : ""}`}>
                        <div
                          className={`rounded-2xl px-4 py-3 shadow-sm ${message.sender === "user"
                            ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground ml-auto shadow-primary/20"
                            : "bg-gradient-to-br from-muted/80 to-muted/40 backdrop-blur-sm border border-border/30"
                            }`}
                        >
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>

                          {/* Enhanced News Display */}
                          {message.toolCalls && message.toolCalls.length > 0 && (
                            <div className="mt-4">
                              {message.toolCalls.map((toolCall, idx) => {
                                // Check if this is a news-related tool
                                const isNewsToolCall = toolCall.tool === 'get_news' || toolCall.tool === 'search_news';
                                
                                // Parse news result - handle different formats
                                let newsArticles: any[] = [];
                                if (isNewsToolCall && toolCall.result) {
                                  if (Array.isArray(toolCall.result)) {
                                    newsArticles = toolCall.result;
                                  } else if (toolCall.result.articles && Array.isArray(toolCall.result.articles)) {
                                    newsArticles = toolCall.result.articles;
                                  } else if (typeof toolCall.result === 'string') {
                                    // Try to extract news from text format
                                    try {
                                      // Extract URLs and titles from the text
                                      const lines = toolCall.result.split('\n');
                                      const articles: any[] = [];
                                      let currentArticle: any = {};
                                      
                                      for (const line of lines) {
                                        const trimmed = line.trim();
                                        if (trimmed.match(/^\d+\.\s+\*\*(.+?)\*\*/)) {
                                          // Save previous article if exists
                                          if (currentArticle.title) {
                                            articles.push({ ...currentArticle });
                                          }
                                          // Start new article
                                          const title = trimmed.match(/^\d+\.\s+\*\*(.+?)\*\*/)?.[1] || '';
                                          currentArticle = { title: title.trim() };
                                        } else if (trimmed.startsWith('- ') && !trimmed.includes('[Read more]')) {
                                          // Description line
                                          const desc = trimmed.replace(/^-\s*/, '').trim();
                                          if (desc && !currentArticle.description) {
                                            currentArticle.description = desc;
                                          }
                                        } else if (trimmed.includes('[Read more]')) {
                                          // Extract URL
                                          const urlMatch = trimmed.match(/\[Read more\]\((.+?)\)/);
                                          if (urlMatch) {
                                            currentArticle.url = urlMatch[1];
                                          }
                                        }
                                      }
                                      // Don't forget the last article
                                      if (currentArticle.title) {
                                        articles.push({ ...currentArticle });
                                      }
                                      newsArticles = articles;
                                    } catch (error) {
                                      console.error('Error parsing news text:', error);
                                    }
                                  }
                                }
                                
                                if (isNewsToolCall && newsArticles.length > 0) {
                                  return (
                                    <div key={idx} className="space-y-4 mt-6">
                                      <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-linear-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
                                        <div className="w-3 h-3 bg-linear-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
                                        <span className="text-sm font-semibold text-blue-400 uppercase tracking-wider">
                                          📰 Latest News
                                        </span>
                                        <div className="ml-auto text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                                          {newsArticles.length} articles
                                        </div>
                                      </div>
                                      
                                      <div className="grid gap-4">
                                        {newsArticles.map((article: any, articleIdx: number) => (
                                          <div key={articleIdx} className="group">
                                            <Card className="p-5 bg-linear-to-br from-background/80 to-muted/30 border border-border/30 hover:border-primary/30 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                                              <div className="space-y-3">
                                                <div className="flex items-start justify-between gap-4">
                                                  <h3 className="font-semibold text-base leading-tight flex-1 group-hover:text-primary transition-colors">
                                                    {article.url ? (
                                                      <a 
                                                        href={article.url} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="hover:text-primary transition-colors line-clamp-3"
                                                      >
                                                        {article.title}
                                                      </a>
                                                    ) : (
                                                      <span className="line-clamp-3">{article.title}</span>
                                                    )}
                                                  </h3>
                                                  {article.url && (
                                                    <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                                      <ExternalLink className="h-4 w-4 text-primary" />
                                                    </div>
                                                  )}
                                                </div>
                                                
                                                {article.description && (
                                                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                                                    {article.description}
                                                  </p>
                                                )}
                                                
                                                <div className="flex items-center justify-between pt-2 border-t border-border/30">
                                                  <div className="flex items-center gap-2">
                                                    {article.source && (
                                                      <div className="flex items-center gap-1">
                                                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                                                        <span className="font-medium text-sm text-primary">
                                                          {article.source}
                                                        </span>
                                                      </div>
                                                    )}
                                                  </div>
                                                  {article.publishedAt && (
                                                    <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                                                      {new Date(article.publishedAt).toLocaleDateString('en-US', { 
                                                        month: 'short', 
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                      })}
                                                    </span>
                                                  )}
                                                </div>
                                              </div>
                                            </Card>
                                          </div>
                                        ))}
                                      </div>
                                      
                                      {/* Summary footer */}
                                      <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border/30">
                                        <p className="text-xs text-muted-foreground text-center">
                                          💡 Found {newsArticles.length} relevant articles • Click any headline to read more
                                        </p>
                                      </div>
                                    </div>
                                  );
                                } else if (isNewsToolCall && toolCall.result) {
                                  // Fallback display for news that couldn't be parsed into cards
                                  return (
                                    <div key={idx} className="mt-4 pt-4 border-t border-border/30">
                                      <div className="flex items-center gap-2 mb-3">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                        <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                                          📰 News Update
                                        </p>
                                      </div>
                                      <div className="bg-linear-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-4">
                                        <div className="prose prose-sm max-w-none dark:prose-invert">
                                          <pre className="whitespace-pre-wrap text-sm leading-relaxed">{
                                            typeof toolCall.result === 'string' 
                                              ? toolCall.result 
                                              : JSON.stringify(toolCall.result, null, 2)
                                          }</pre>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                }
                                
                                // Default tool display for non-news tools
                                return (
                                  <div key={idx} className="mt-4 pt-4 border-t border-border/30">
                                    <div className="flex items-center gap-2 mb-3">
                                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                      <p className="text-xs font-semibold text-green-400 uppercase tracking-wider">
                                        🔧 Tool Executed
                                      </p>
                                    </div>
                                    <div className="bg-linear-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-lg p-3">
                                      <Badge variant="outline" className="text-xs mb-2 border-primary/30 text-primary">
                                        {toolCall.tool}
                                      </Badge>
                                      <details className="text-xs text-muted-foreground">
                                        <summary className="cursor-pointer hover:underline hover:text-foreground transition-colors font-medium">
                                          View execution details
                                        </summary>
                                        <pre className="mt-2 p-3 bg-background/60 rounded border border-border/30 text-[10px] overflow-x-auto font-mono">
                                          {JSON.stringify(toolCall.parameters, null, 2)}
                                        </pre>
                                      </details>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 px-2">
                          {formatTime(message.timestamp)}
                        </p>
                      </div>

                      {message.sender === "user" && (
                        <Avatar className="h-8 w-8 mt-1">
                          <AvatarFallback className="bg-linear-to-r from-green-500 to-teal-500 text-white text-xs">
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex gap-3">
                      <Avatar className="h-8 w-8 mt-1">
                        <AvatarFallback className="bg-linear-to-r from-purple-500 to-blue-500 text-white text-xs">
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-muted rounded-2xl px-4 py-3">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Input Area */}
              <div className="border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 p-4">
                <div className="relative">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={authenticated ? "Ask me anything... (e.g., What's the weather in London?)" : "Connect wallet to start chatting..."}
                    disabled={!authenticated || isSending}
                    className="pr-24 py-6 text-base rounded-2xl border-2 focus:border-primary"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">

                    <Button
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim() || isSending || !authenticated}
                      size="sm"
                      className="h-8 w-8 p-0 rounded-full"
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
      </SidebarInset>
    </SidebarProvider>
  );
}