"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, ExternalLink, Code, Zap, FileText, CheckCircle2, XCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface MCPServerDetailProps {
  data: {
    type: string
    name: string
    description: string
    image: string
    endpoints: Array<{
      name: string
      endpoint: string
      version: string
      mcpTools: Array<{
        name: string
        description: string
        endpoint: string
        parameters: Array<{
          name: string
          type: string
          description: string
          required: boolean
          enum?: string[]
        }>
        pricing: {
          price: string
          network: string
          tokens: Array<{
            address: string
            symbol: string
            decimals: number
          }>
          chainId: number
        }
      }>
      mcpPrompts: Array<{
        name: string
        description: string
        parameters: Array<{
          name: string
          description: string
          required: boolean
        }>
      }>
      mcpResources: Array<{
        name: string
        uri: string
        description: string
        mimeType: string
      }>
    }>
    active: boolean
    x402support: boolean
  }
}

export function MCPServerDetail({ data }: MCPServerDetailProps) {
  const endpoint = data.endpoints[0]

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Back Button */}
      <Link href="/dashboard">
        <Button variant="outline" size="sm" className="w-fit gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </Link>

      {/* Hero Section */}
      <Card className="overflow-hidden">
        <div className="relative h-48 w-full">
          <Image
            src={data.image}
            alt={data.name}
            fill
            className="object-cover"
          />
        </div>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-3xl">{data.name}</CardTitle>
              <CardDescription className="text-base">{data.description}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant={data.active ? "default" : "outline"}>
                {data.active ? (
                  <>
                    <CheckCircle2 className="h-3 w-3" />
                    Active
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3" />
                    Inactive
                  </>
                )}
              </Badge>
              {data.x402support && (
                <Badge variant="secondary">x402 Support</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardFooter className="gap-3">
          <Badge variant="outline" className="text-xs">
            <Code className="h-3 w-3" />
            {endpoint.version}
          </Badge>
          <Badge variant="outline" className="text-xs">
            <ExternalLink className="h-3 w-3" />
            {endpoint.endpoint}
          </Badge>
        </CardFooter>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="tools" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tools">
            <Zap className="h-4 w-4 mr-2" />
            Tools ({endpoint.mcpTools.length})
          </TabsTrigger>
          <TabsTrigger value="prompts">
            <FileText className="h-4 w-4 mr-2" />
            Prompts ({endpoint.mcpPrompts.length})
          </TabsTrigger>
          <TabsTrigger value="resources">
            <Code className="h-4 w-4 mr-2" />
            Resources ({endpoint.mcpResources.length})
          </TabsTrigger>
        </TabsList>

        {/* Tools Tab */}
        <TabsContent value="tools" className="space-y-4">
          {endpoint.mcpTools.map((tool, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{tool.name}</CardTitle>
                    <CardDescription>{tool.description}</CardDescription>
                  </div>
                  <Badge variant="secondary">{tool.pricing.price}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Endpoint */}
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground mb-1">Endpoint</p>
                  <code className="text-sm">{tool.endpoint}</code>
                </div>

                {/* Parameters */}
                <div>
                  <h4 className="text-sm font-semibold mb-3">Parameters</h4>
                  <div className="space-y-2">
                    {tool.parameters.map((param, pIndex) => (
                      <div key={pIndex} className="flex items-start gap-3 rounded-lg border p-3">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-medium">{param.name}</code>
                            <Badge variant={param.required ? "default" : "outline"} className="text-xs">
                              {param.required ? "Required" : "Optional"}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">{param.type}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{param.description}</p>
                          {param.enum && (
                            <div className="flex gap-1 mt-1">
                              {param.enum.map((val, vIndex) => (
                                <Badge key={vIndex} variant="outline" className="text-xs">
                                  {val}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pricing Details */}
                <div className="rounded-lg border p-4 space-y-3">
                  <h4 className="text-sm font-semibold">Pricing Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Price</p>
                      <p className="text-sm font-medium">{tool.pricing.price}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Network</p>
                      <p className="text-sm font-medium">{tool.pricing.network}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Chain ID</p>
                      <p className="text-sm font-medium">{tool.pricing.chainId}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Token</p>
                      <p className="text-sm font-medium">{tool.pricing.tokens[0].symbol}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Prompts Tab */}
        <TabsContent value="prompts" className="space-y-4">
          {endpoint.mcpPrompts.map((prompt, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-xl">{prompt.name}</CardTitle>
                <CardDescription>{prompt.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Parameters</h4>
                  {prompt.parameters.map((param, pIndex) => (
                    <div key={pIndex} className="flex items-start gap-3 rounded-lg border p-3">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-medium">{param.name}</code>
                          <Badge variant={param.required ? "default" : "outline"} className="text-xs">
                            {param.required ? "Required" : "Optional"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{param.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {endpoint.mcpResources.map((resource, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{resource.name}</CardTitle>
                  <CardDescription>{resource.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-xs text-muted-foreground mb-1">URI</p>
                    <code className="text-sm break-all">{resource.uri}</code>
                  </div>
                  <Badge variant="secondary" className="text-xs">{resource.mimeType}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
