"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardFooter, CardAction } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Zap, FileText, Code, Star } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { AgentDataType, calculateAverageRating, scoreToStars } from "@/lib/graphql/client"

interface MCPServerCardProps {
  data: AgentDataType,
  id?: string
}

interface StarRatingProps {
  rating: number;
  className?: string;
}

function StarRating({ rating, className = "" }: StarRatingProps) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {/* Full stars */}
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star key={`full-${i}`} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
      ))}
      {/* Half star */}
      {hasHalfStar && (
        <div className="relative">
          <Star className="h-3 w-3 text-gray-300" />
          <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          </div>
        </div>
      )}
      {/* Empty stars */}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <Star key={`empty-${i}`} className="h-3 w-3 text-gray-300" />
      ))}
    </div>
  );
}

export function MCPServerCard({ data, id }: MCPServerCardProps) {
  const regFile = data.registrationFile
  const toolsCount = regFile.mcpTools.length
  const promptsCount = regFile.mcpPrompts.length
  const resourcesCount = regFile.mcpResources.length
  
  // Calculate rating from feedback
  const averageScore = calculateAverageRating(data.feedback);
  const starRating = scoreToStars(averageScore);
  const reviewCount = data.feedback?.length || 0;

  return (
    <Link href={`/marketplace/${data.agentId}`}>
      <Card className="@container/card hover:shadow-lg transition-shadow cursor-pointer group h-full flex flex-col">
        <div className="relative h-48 w-full overflow-hidden rounded-t-xl bg-muted">
          <Image
            src={regFile.image || "/doodles.jpeg"}
            alt={regFile.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={false}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/doodles.jpeg";
            }}
          />
          <div className="absolute top-3 right-3 flex gap-2">
            {regFile.active && (
              <Badge variant="default" className="bg-white text-black">
                Active
              </Badge>
            )}
            <Badge variant="secondary">
              x402
            </Badge>
          </div>
        </div>
        
        <CardHeader className="pb-3 shrink-0">
          <CardDescription className="line-clamp-1 text-xs">Agent #{data.agentId}</CardDescription>
          <CardTitle className="text-lg font-semibold @[250px]/card:text-xl line-clamp-2 leading-tight">
            {regFile.name}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="h-6 w-6 p-0 flex items-center justify-center">
              <ExternalLink className="h-3 w-3" />
            </Badge>
          </CardAction>
        </CardHeader>

        <CardFooter className="flex-col items-start text-sm flex-1 justify-between pt-0">
          <div className="w-full space-y-3">
            <div className="line-clamp-2 text-muted-foreground text-sm leading-relaxed">
              {regFile.description}
            </div>
            
            {/* Rating display - fixed height container */}
            <div className="h-6 flex items-center w-full">
              {reviewCount > 0 ? (
                <div className="flex items-center gap-2">
                  <StarRating rating={starRating} />
                  <span className="text-xs text-muted-foreground">
                    {starRating.toFixed(1)} ({averageScore}/100) • {reviewCount} review{reviewCount !== 1 ? 's' : ''}
                  </span>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">No reviews yet</span>
              )}
            </div>
          </div>
          
          <div className="flex mt-3 flex-wrap w-full gap-1">
            <Badge variant="secondary" className="gap-1 text-xs">
              <Zap className="h-3 w-3" />
              {toolsCount} Tools
            </Badge>
            <Badge variant="secondary" className="gap-1 text-xs">
              <FileText className="h-3 w-3" />
              {promptsCount} Prompts
            </Badge>
            <Badge variant="secondary" className="gap-1 text-xs">
              <Code className="h-3 w-3" />
              {resourcesCount} Resources
            </Badge>
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}
