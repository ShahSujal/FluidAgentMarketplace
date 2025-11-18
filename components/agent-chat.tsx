"use client";

import { useState } from "react";
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
  User
} from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

interface Message {
  id: string;
  content: string;
  sender: "user" | "agent";
  timestamp: Date;
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

export function AgentChat() {
  const [messages, setMessages] = useState<Message[]>([
    // {
    //   id: "1",
    //   content: "Hello! I'm your AI assistant. How can I help you today?",
    //   sender: "agent",
    //   timestamp: new Date(Date.now() - 60000),
    // },
    // {
    //   id: "2", 
    //   content: "I need help with creating a smart contract for my project.",
    //   sender: "user",
    //   timestamp: new Date(Date.now() - 30000),
    // },
    // {
    //   id: "3",
    //   content: "I'd be happy to help you create a smart contract! What type of contract are you looking to build? Are you thinking of an ERC-20 token, NFT collection, DeFi protocol, or something else?",
    //   sender: "agent",
    //   timestamp: new Date(),
    // },
  ]);

  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const quickActions: QuickAction[] = [
    // {
    //   id: "image",
    //   label: "Create Image",
    //   icon: <ImageIcon className="h-4 w-4" />,
    //   description: "Create high-quality images instantly from text."
    // },
    // {
    //   id: "presentation", 
    //   label: "Make Slides",
    //   icon: <FileText className="h-4 w-4" />,
    //   description: "Turn ideas into engaging, professional presentations."
    // },
    // {
    //   id: "code",
    //   label: "Generate Code",
    //   icon: <Code className="h-4 w-4" />,
    //   description: "Generate clean, production ready code in seconds."
    // },
  ];

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const newUserMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate agent response
    setTimeout(() => {
      const agentResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: "That's a great question! Let me help you with that...",
        sender: "agent",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, agentResponse]);
      setIsTyping(false);
    }, 2000);
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
            <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
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
             
            </div>

            {/* Messages Area */}
            <div className="flex-1 flex flex-col">
              {messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 p-8">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-500 flex items-center justify-center shadow-2xl">
                      <Sparkles className="h-12 w-12 text-white" />
                    </div>
                    <div className="absolute inset-0 w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-500 animate-pulse opacity-20"></div>
                  </div>
                  
                  <div className="space-y-2">
                    <h2 className="text-2xl font-semibold">Ready to Create Something New?</h2>
                    <p className="text-muted-foreground max-w-md">
                      Start a conversation with FluidGPT to get help with coding, content creation, analysis, and more.
                    </p>
                  </div>

                  {/* Quick Actions */}
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
                          <AvatarFallback className="bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs">
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
                          <p className="text-sm leading-relaxed">{message.content}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 px-2">
                          2 min ago
                        </p>
                      </div>

                      {message.sender === "user" && (
                        <Avatar className="h-8 w-8 mt-1">
                          <AvatarFallback className="bg-gradient-to-r from-green-500 to-teal-500 text-white text-xs">
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex gap-3">
                      <Avatar className="h-8 w-8 mt-1">
                        <AvatarFallback className="bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs">
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
              <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
                <div className="relative">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask Anything..."
                    className="pr-24 py-6 text-base rounded-2xl border-2 focus:border-primary"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  
                    <Button
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim()}
                      size="sm"
                      className="h-8 w-8 p-0 rounded-full"
                    >
                      <Send className="h-4 w-4" />
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