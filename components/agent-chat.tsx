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
  Wallet
} from "lucide-react";
import { Signer } from "fluidsdk";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { executeChat } from "@/actions/chat/executechat";
import { useWalletClient, useAccount, useBalance } from "wagmi";
import { walletClientToSigner } from "@/lib/scripts/walletClient";
import { toast } from "sonner";
import { getBalance } from "@wagmi/core";
import { config } from "@/lib/config/wagmi.config";
import { parseEther, parseUnits } from "viem";
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
  const { address } = useAccount();
  
  const { data: walletClient } = useWalletClient();
  const { isConnected } = useAccount();

  const getUserBalance = async () => {
    if (!address) return;
    
    setIsRefreshing(true);
    try {
      const { decimals, value } = await getBalance(config, {
        address: address,
        token: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
      });
      
      // Convert to human readable format
      const balanceInUnits = Number(value) / Math.pow(10, decimals);
      setBalance(balanceInUnits.toFixed(2));
    } catch (error) {
      console.error("Error fetching balance:", error);
      setBalance("0");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Fetch balance on mount and when address changes
  useEffect(() => {
    if (isConnected && address) {
      getUserBalance();
    } else {
      setBalance("0");
    }
  }, [isConnected, address]);

  const quickActions: QuickAction[] = [];

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    if (!isConnected) {
      toast.error("Please connect your wallet to chat");
      return;
    }

    if (!walletClient) {
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

      // Execute chat with full conversation history
      const result = await executeChat({
        messages: chatMessages,
        signer: walletClient as Signer,
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
              {isConnected && (
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
                      {isConnected 
                        ? "Start a conversation with FluidGPT. Ask me to check weather, perform calculations, or use any available MCP tools!"
                        : "Please connect your wallet to start chatting and using tools."}
                    </p>
                  </div>

                  {!isConnected && (
                    <Badge variant="destructive" className="text-sm">
                      Wallet not connected
                    </Badge>
                  )}

                  {/* Quick Actions */}
                  {isConnected && quickActions.length > 0 && (
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
                      
                      <div className={`max-w-[70%] ${message.sender === "user" ? "order-first" : ""}`}>
                        <div
                          className={`rounded-2xl px-4 py-3 ${
                            message.sender === "user"
                              ? "bg-primary text-primary-foreground ml-auto"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                          
                          {/* Show tool execution info */}
                          {message.toolCalls && message.toolCalls.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-border/50">
                              <p className="text-xs font-medium mb-2 text-muted-foreground">
                                🔧 Executed {message.toolCalls.length} tool{message.toolCalls.length > 1 ? 's' : ''}:
                              </p>
                              {message.toolCalls.map((toolCall, idx) => (
                                <div key={idx} className="text-xs space-y-1 mb-2">
                                  <Badge variant="outline" className="text-xs">
                                    {toolCall.tool}
                                  </Badge>
                                  <details className="text-xs text-muted-foreground">
                                    <summary className="cursor-pointer hover:underline">
                                      View details
                                    </summary>
                                    <pre className="mt-1 p-2 bg-background/50 rounded text-[10px] overflow-x-auto">
                                      {JSON.stringify(toolCall.parameters, null, 2)}
                                    </pre>
                                  </details>
                                </div>
                              ))}
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
                    placeholder={isConnected ? "Ask me anything... (e.g., What's the weather in London?)" : "Connect wallet to start chatting..."}
                    disabled={!isConnected || isSending}
                    className="pr-24 py-6 text-base rounded-2xl border-2 focus:border-primary"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  
                    <Button
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim() || isSending || !isConnected}
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