"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardFooter, CardAction } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Zap, FileText, Code } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { AgentDataType } from "@/lib/graphql/client"

interface MCPServerCardProps {
  data: AgentDataType,
  id?: string
}

export function MCPServerCard({ data, id }: MCPServerCardProps) {
  const regFile = data.registrationFile
  const toolsCount = regFile.mcpTools.length
  const promptsCount = regFile.mcpPrompts.length
  const resourcesCount = regFile.mcpResources.length

  return (
    <Link href={`/marketplace/${data.agentId}`}>
      <Card className="@container/card hover:shadow-lg transition-shadow cursor-pointer group">
        <div className="relative h-52 w-full overflow-hidden rounded-t-xl">
          <Image
            src={regFile.image || "/doodles.jpeg"}
            alt={regFile.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-2 right-2 flex gap-2">
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
        
        <CardHeader className="h-10">
          <CardDescription className="line-clamp-1">Agent #{data.agentId}</CardDescription>
          <CardTitle className="text-xl font-semibold @[250px]/card:text-2xl line-clamp-2">
            {regFile.name}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <ExternalLink className="h-3 w-3" />
            </Badge>
          </CardAction>
        </CardHeader>

        <CardFooter className="flex-col items-start text-sm">
          <div className="line-clamp-2 text-muted-foreground">
            {regFile.description}
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
