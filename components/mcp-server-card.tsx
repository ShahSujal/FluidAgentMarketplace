"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardFooter, CardAction } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingDown, TrendingUp, ExternalLink, Zap, FileText, Code } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface MCPServerCardProps {
  data: {
    type: string
    name: string
    description: string
    image: string
    endpoints: Array<{
      mcpTools: any[]
      mcpPrompts: any[]
      mcpResources: any[]
    }>
    active: boolean
    x402support: boolean
  }
  id?: string
}

export function MCPServerCard({ data, id = "mcp-1" }: MCPServerCardProps) {
  const endpoint = data.endpoints[0]
  const toolsCount = endpoint.mcpTools.length
  const promptsCount = endpoint.mcpPrompts.length
  const resourcesCount = endpoint.mcpResources.length

  return (
    <Link href={`/dashboard/${id}`}>
      <Card className="@container/card hover:shadow-lg transition-shadow cursor-pointer group">
        <div className="relative h-52 w-full overflow-hidden rounded-t-xl">
          <Image
            src={"/doodles.jpeg"}
            alt={data.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-2 right-2 flex gap-2">
            {data.active && (
              <Badge variant="default" className="bg-white text-black">
                Active
              </Badge>
            )}
            {data.x402support && (
              <Badge variant="secondary">
                x402
              </Badge>
            )}
          </div>
        </div>
        
        <CardHeader className="h-10">
          <CardDescription className="line-clamp-1">{data.type.split("#")[1] || "MCP Server"}</CardDescription>
          <CardTitle className="text-xl font-semibold @[250px]/card:text-2xl line-clamp-2">
            {data.name}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <ExternalLink className="h-3 w-3" />
            </Badge>
          </CardAction>
        </CardHeader>

        <CardFooter className="flex-col items-start text-sm">
          <div className="line-clamp-2 text-muted-foreground">
            {data.description}
          </div>
          
          <div className="flex mt-4 flex-wrap w-full">
            <Badge variant="secondary" className="gap-1">
              <Zap className="h-3 w-3" />
              {toolsCount} Tools
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <FileText className="h-3 w-3" />
              {promptsCount} Prompts
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Code className="h-3 w-3" />
              {resourcesCount} Resources
            </Badge>
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}
