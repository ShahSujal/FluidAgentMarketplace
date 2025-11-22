"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Zap, Star, DollarSign, Info, ExternalLink, Package } from "lucide-react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

interface ToolUsageCardProps {
  toolName: string;
  mcpName?: string;
  mcpDescription?: string;
  mcpImage?: string;
  price: string;
  network: string;
  rating?: number;
  feedbackCount?: number;
  parameters?: Record<string, any>;
  index: number;
}

export function ToolUsageCard({
  toolName,
  mcpName,
  mcpDescription,
  mcpImage,
  price,
  network,
  rating,
  feedbackCount,
  parameters,
  index,
}: ToolUsageCardProps) {
  const displayRating = rating || 0;
  const displayFeedback = feedbackCount || 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
    >
      <Drawer>
        <DrawerTrigger asChild>
          <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/50 cursor-pointer">
            <div className="p-4 space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 flex-1">
                  {mcpImage && (
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={mcpImage} alt={mcpName} />
                      <AvatarFallback className="bg-primary/10">
                        <Package className="h-5 w-5 text-primary" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                      {mcpName || toolName}
                    </h4>
                    <p className="text-xs text-muted-foreground truncate">
                      {toolName}
                    </p>
                  </div>
                </div>
                <Info className="h-4 w-4 text-muted-foreground shrink-0" />
              </div>

              {/* Pricing & Rating */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs">
                  <DollarSign className="h-3 w-3 text-green-500" />
                  <span className="font-medium">{price}</span>
                  <span className="text-muted-foreground">{network}</span>
                </div>
                
                {displayRating > 0 && (
                  <div className="flex items-center gap-1 text-xs">
                    <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                    <span className="font-medium">{displayRating.toFixed(1)}</span>
                    {displayFeedback > 0 && (
                      <span className="text-muted-foreground">({displayFeedback})</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </DrawerTrigger>

        <DrawerContent>
          <div className="mx-auto w-full max-w-2xl">
            <DrawerHeader>
              <div className="flex items-center gap-4 mb-4">
                {mcpImage && (
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={mcpImage} alt={mcpName} />
                    <AvatarFallback className="bg-primary/10">
                      <Package className="h-8 w-8 text-primary" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className="flex-1">
                  <DrawerTitle className="text-2xl">{mcpName || toolName}</DrawerTitle>
                  <DrawerDescription>MCP Server Tool</DrawerDescription>
                </div>
              </div>
            </DrawerHeader>

            <div className="p-4 pb-0 space-y-6">
              {/* Tool Name */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Tool Name
                </h3>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <p className="text-lg font-medium">{toolName}</p>
                </div>
              </div>

              <Separator />

              {/* Description */}
              {mcpDescription && (
                <>
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Description
                    </h3>
                    <p className="text-sm leading-relaxed">{mcpDescription}</p>
                  </div>
                  <Separator />
                </>
              )}

              {/* Pricing */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Pricing
                </h3>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-semibold">{price}</p>
                    <p className="text-xs text-muted-foreground">{network}</p>
                  </div>
                </div>
              </div>

              {/* Rating & Feedback */}
              {displayRating > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Rating & Feedback
                    </h3>
                    <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Star className="h-6 w-6 fill-yellow-500 text-yellow-500" />
                        <div>
                          <p className="text-2xl font-bold">{displayRating.toFixed(1)}</p>
                          <p className="text-xs text-muted-foreground">Average Rating</p>
                        </div>
                      </div>
                      {displayFeedback > 0 && (
                        <>
                          <Separator orientation="vertical" className="h-12" />
                          <div>
                            <p className="text-2xl font-bold">{displayFeedback}</p>
                            <p className="text-xs text-muted-foreground">Reviews</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Parameters Used */}
              {parameters && Object.keys(parameters).length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Parameters Used
                    </h3>
                    <div className="space-y-2">
                      {Object.entries(parameters).map(([key, value]) => (
                        <div key={key} className="flex items-start gap-2 p-2 bg-muted/30 rounded">
                          <Badge variant="outline" className="shrink-0">
                            {key}
                          </Badge>
                          <p className="text-sm break-all">{String(value)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="outline">Close</Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    </motion.div>
  );
}

interface ToolUsageGridProps {
  tools: Array<{
    toolName: string;
    mcpName?: string;
    mcpDescription?: string;
    mcpImage?: string;
    price: string;
    network: string;
    rating?: number;
    feedbackCount?: number;
    parameters?: Record<string, any>;
  }>;
}

export function ToolUsageGrid({ tools }: ToolUsageGridProps) {
  if (!tools || tools.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 mt-3">
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-primary" />
        <h4 className="font-semibold text-sm">Tools Used</h4>
        <Badge variant="outline" className="text-xs">
          {tools.length}
        </Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {tools.map((tool, index) => (
          <ToolUsageCard key={index} {...tool} index={index} />
        ))}
      </div>
    </div>
  );
}
