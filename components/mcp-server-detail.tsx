"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ArrowLeft, ExternalLink, Code, Zap, FileText, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { AgentDataType } from "@/lib/graphql/client"
import { useEffect, useState } from "react"
import { executeTask } from "@/lib/scripts/execute"
import { useWalletClient } from "wagmi"
import { Signer } from "x402-axios"

interface ToolParameter {
  name: string
  type: string
  description: string
  required: boolean
  enum?: string[]
}

interface ToolPricing {
  price: string
  network: string
  tokens: Array<{
    address: string
    symbol: string
    decimals: number
  }>
  chainId: number
}

interface Tool {
  name: string
  description: string
  endpoint: string
  parameters: ToolParameter[]
  pricing: ToolPricing
}

interface IPFSMetadata {
  type: string
  name: string
  description: string
  image?: string
  creatorAddress: string
  tools?: Tool[]
  endpoints?: Array<{
    name: string
    endpoint: string
    version?: string
    mcpTools?: string[]
    mcpPrompts?: string[]
    mcpResources?: string[]
  }>
  active: boolean
  x402support: boolean
  pricing?: {
    defaultPrice?: string
    currency?: string
    network?: string
    token?: string
  }
}

interface MCPServerDetailProps {
  data: AgentDataType
}

export function MCPServerDetail({ data }: MCPServerDetailProps) {
  const regFile = data.registrationFile
  const [ipfsData, setIpfsData] = useState<IPFSMetadata | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [trialParams, setTrialParams] = useState<Record<string, Record<string, any>>>({})
  const [trialLoading, setTrialLoading] = useState<Record<string, boolean>>({})
  const [trialResults, setTrialResults] = useState<Record<string, any>>({})
  const [dialogOpen, setDialogOpen] = useState(false)
  const [currentTool, setCurrentTool] = useState<Tool | null>(null)

    const { data: walletClient } = useWalletClient();
  
  const getIpFSData = async(uri: string) => {
    try {
      setIsLoading(true)
      console.log("Fetching IPFS data from:", uri)
      
      const ipfsUri = uri.replace("ipfs://", "https://ipfs.io/ipfs/")
      const response = await fetch(ipfsUri)
      const fetchedData = await response.json()
      
      console.log("IPFS data fetched:", fetchedData)
      setIpfsData(fetchedData)
    } catch (error) {
      console.error("Error fetching IPFS data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTrialCall = async (tool: Tool) => {
    const toolKey = tool.name
    setTrialLoading(prev => ({ ...prev, [toolKey]: true }))
    setTrialResults(prev => ({ ...prev, [toolKey]: null }))

    try {
        if (!walletClient) {
      console.error("Wallet not connected");
      return;
    }

      const params = trialParams[toolKey] || {}
      
      console.log('Current trial params:', trialParams)
      console.log('Params for tool:', toolKey, params)
      console.log('Tool parameters:', tool.parameters)
      
      // Validate required parameters - check for undefined, null, or empty string
      const missingParams = tool.parameters
        .filter(p => p.required && (params[p.name] === undefined || params[p.name] === null || params[p.name] === ''))
        .map(p => p.name)
      
      if (missingParams.length > 0) {
        throw new Error(`Missing required parameters: ${missingParams.join(', ')}`)
      }

      console.log(`Calling trial for ${tool.name}:`, { endpoint: tool.endpoint, params })

 


      const result = await executeTask({
        endpoint: tool.endpoint,
        mcpServerUrl: displayData.mcpEndpoint,
        parameters: params,
        signer: walletClient as Signer,
      })
      console.log(`lls`, result)
      if (result) {
        setTrialResults(prev => ({
          ...prev,
          [toolKey]: result
        }))
      }

    } catch (error: any) {
      console.error(`Error calling trial for ${tool.name}:`, error)
      setTrialResults(prev => ({ 
        ...prev, 
        [toolKey]: { success: false, error: error.message || String(error) } 
      }))
    } finally {
      setTrialLoading(prev => ({ ...prev, [toolKey]: false }))
    }
  }

  const openTrialDialog = (tool: Tool) => {
    setCurrentTool(tool)
    setDialogOpen(true)
    // Reset trial results and params for this tool
    setTrialResults(prev => ({ ...prev, [tool.name]: null }))
    // Initialize params object for this tool if it doesn't exist
    if (!trialParams[tool.name]) {
      setTrialParams(prev => ({ ...prev, [tool.name]: {} }))
    }
  }

  const closeTrialDialog = () => {
    setDialogOpen(false)
    setCurrentTool(null)
  }

  const updateTrialParam = (toolName: string, paramName: string, value: any) => {
    console.log('Updating trial param:', { toolName, paramName, value })
    setTrialParams(prev => {
      const updated = {
        ...prev,
        [toolName]: {
          ...(prev[toolName] || {}),
          [paramName]: value
        }
      }
      console.log('Updated trial params:', updated)
      return updated
    })
  }
  
  useEffect(() => {
    getIpFSData(data.agentURI)
  }, [data.agentURI])

  // Check if we have new format (tools array) or old format (endpoints array)
  const hasNewFormat = ipfsData?.tools && ipfsData.tools.length > 0
  
  // Extract data based on format
  const mcpEndpoint = ipfsData?.endpoints?.find(ep => ep.name === "MCP")
  const agentWalletEndpoint = ipfsData?.endpoints?.find(ep => ep.name === "agentWallet")
  
  // Parse wallet address and chain ID
  const walletData = agentWalletEndpoint?.endpoint?.split(':')
  const chainId = hasNewFormat 
    ? String(ipfsData?.tools?.[0]?.pricing?.chainId || regFile.agentWalletChainId)
    : (walletData?.[1] || regFile.agentWalletChainId)
  const walletAddress = hasNewFormat 
    ? ipfsData?.creatorAddress || ''
    : (walletData?.[2] || '')
  
  // Get network name from chainId
  const getNetworkName = (chainId: string) => {
    const networks: Record<string, string> = {
      '84532': 'base-sepolia',
      '8453': 'base',
      '1': 'ethereum',
      '137': 'polygon',
      '10': 'optimism',
      '42161': 'arbitrum'
    }
    return networks[chainId] || 'unknown'
  }
  
  // Parse resources from IPFS data or fallback to regFile
  const resources = (mcpEndpoint?.mcpResources || regFile.mcpResources).map(resourceStr => {
    try {
      return JSON.parse(resourceStr)
    } catch {
      return { name: resourceStr, uri: '', description: '', mimeType: 'text/plain' }
    }
  })

  // Get tools and prompts based on format
  const tools: Tool[] = hasNewFormat 
    ? (ipfsData?.tools || [])
    : (mcpEndpoint?.mcpTools || regFile.mcpTools).map((name: string) => ({
        name,
        description: `${name} tool`,
        endpoint: `/mcp/${name}`,
        parameters: [],
        pricing: {
          price: '$0.001',
          network: getNetworkName(chainId),
          tokens: [{ address: '', symbol: 'USDC', decimals: 6 }],
          chainId: Number(chainId)
        }
      }))

  const prompts = (mcpEndpoint?.mcpPrompts || regFile.mcpPrompts).map((name: string) => ({
    name,
    description: `${name} prompt template`
  }))

  // Use IPFS data if available, otherwise fallback to regFile
  const displayData = {
    name: ipfsData?.name || regFile.name,
    description: ipfsData?.description || regFile.description,
    image: ipfsData?.image || regFile.image,
    active: ipfsData?.active ?? regFile.active,
    x402support: ipfsData?.x402support ?? true,
    mcpEndpoint: hasNewFormat ? 'https://fluidmcpserver.vercel.app' : (mcpEndpoint?.endpoint || regFile.mcpEndpoint),
    mcpVersion: mcpEndpoint?.version || regFile.mcpVersion || '1.0',
    creatorAddress: ipfsData?.creatorAddress || '',
  }

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Back Button */}
      <Link href="/marketplace">
        <Button variant="outline" size="sm" className="w-fit gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Marketplace
        </Button>
      </Link>

      {/* Hero Section */}
      <Card className="overflow-hidden">
        <div className="relative h-48 w-full">
          <Image
            src={displayData.image || "/doodles.jpeg"}
            alt={displayData.name}
            fill
            className="object-cover"
          />
        </div>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-3xl">
                {isLoading ? "Loading..." : displayData.name}
              </CardTitle>
              <CardDescription className="text-base">
                {isLoading ? "Fetching agent details..." : displayData.description}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant={displayData.active ? "default" : "outline"}>
                {displayData.active ? (
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
              {displayData.x402support && <Badge variant="secondary">x402</Badge>}
            </div>
          </div>
        </CardHeader>
        <CardFooter className="gap-3">
          <Badge variant="outline" className="text-xs">
            <Code className="h-3 w-3" />
            {displayData.mcpVersion}
          </Badge>
          <Badge variant="outline" className="text-xs">
            <ExternalLink className="h-3 w-3" />
            {displayData.mcpEndpoint}
          </Badge>
          {walletAddress && (
            <Badge variant="outline" className="text-xs">
              Chain: {chainId}
            </Badge>
          )}
        </CardFooter>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="tools" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tools" disabled={isLoading}>
            <Zap className="h-4 w-4 mr-2" />
            Tools ({tools.length})
          </TabsTrigger>
          <TabsTrigger value="prompts" disabled={isLoading}>
            <FileText className="h-4 w-4 mr-2" />
            Prompts ({prompts.length})
          </TabsTrigger>
          <TabsTrigger value="resources" disabled={isLoading}>
            <Code className="h-4 w-4 mr-2" />
            Resources ({resources.length})
          </TabsTrigger>
        </TabsList>

        {/* Tools Tab */}
        <TabsContent value="tools" className="space-y-4">
          {tools.map((tool, index) => {
            const priceDisplay = tool.pricing.price
            const tokenSymbol = tool.pricing.tokens[0]?.symbol || 'USDC'
            const isTrialRunning = trialLoading[tool.name]
            const trialResult = trialResults[tool.name]
            
            return (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-xl">{tool.name}</CardTitle>
                      <CardDescription>{tool.description}</CardDescription>
                    </div>
                    <Badge variant="secondary">{priceDisplay}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Endpoint */}
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-xs text-muted-foreground mb-1">Endpoint</p>
                    <code className="text-sm break-all">{tool.endpoint}</code>
                  </div>

                  {/* Pricing Details */}
                  <div className="rounded-lg border p-4 space-y-3">
                    <h4 className="text-sm font-semibold">Pricing Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Price</p>
                        <p className="text-sm font-medium">{priceDisplay}</p>
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
                        <p className="text-sm font-medium">{tokenSymbol}</p>
                      </div>
                    </div>
                    {walletAddress && (
                      <div className="pt-2">
                        <p className="text-xs text-muted-foreground mb-1">Creator Wallet</p>
                        <code className="text-xs break-all">{walletAddress}</code>
                      </div>
                    )}
                  </div>

                  {/* Trial Service Button */}
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => openTrialDialog(tool)}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Try {tool.name} (Free Trial)
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </TabsContent>

        {/* Prompts Tab */}
        <TabsContent value="prompts" className="space-y-4">
          {prompts.map((prompt, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-xl">{prompt.name}</CardTitle>
                <CardDescription>{prompt.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground mb-1">Prompt Name</p>
                  <code className="text-sm">{prompt.name}</code>
                </div>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => {
                    console.log(`Calling trial service for prompt: ${prompt.name}`)
                  }}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Try {prompt.name} (Free Trial)
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {resources.map((resource, index) => (
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

      {/* Trial Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          {currentTool && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Try {currentTool.name}
                </DialogTitle>
                <DialogDescription>
                  {currentTool.description}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                {/* Endpoint Info */}
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground mb-1">Endpoint</p>
                  <code className="text-sm break-all">{currentTool.endpoint}</code>
                </div>

                {/* Parameters Form */}
                {currentTool.parameters.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold">Parameters</h4>
                    {currentTool.parameters.map((param, pIndex) => (
                      <div key={pIndex} className="space-y-2">
                        <Label htmlFor={`dialog-${currentTool.name}-${param.name}`}>
                          {param.name}
                          {param.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        <p className="text-xs text-muted-foreground">{param.description}</p>
                        {param.enum ? (
                          <Select
                            value={trialParams[currentTool.name]?.[param.name] || ''}
                            onValueChange={(value) => updateTrialParam(currentTool.name, param.name, value)}
                            disabled={trialLoading[currentTool.name]}
                          >
                            <SelectTrigger id={`dialog-${currentTool.name}-${param.name}`}>
                              <SelectValue placeholder={`Select ${param.name}`} />
                            </SelectTrigger>
                            <SelectContent>
                              {param.enum.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            id={`dialog-${currentTool.name}-${param.name}`}
                            type={param.type === 'number' ? 'number' : 'text'}
                            placeholder={`Enter ${param.name}`}
                            value={trialParams[currentTool.name]?.[param.name] || ''}
                            onChange={(e) => {
                              const value = param.type === 'number' ? Number(e.target.value) : e.target.value
                              updateTrialParam(currentTool.name, param.name, value)
                            }}
                            disabled={trialLoading[currentTool.name]}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Pricing Info */}
                <div className="rounded-lg border p-4 space-y-3">
                  <h4 className="text-sm font-semibold">Pricing Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Price</p>
                      <p className="text-sm font-medium">{currentTool.pricing.price}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Network</p>
                      <p className="text-sm font-medium">{currentTool.pricing.network}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Chain ID</p>
                      <p className="text-sm font-medium">{currentTool.pricing.chainId}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Token</p>
                      <p className="text-sm font-medium">{currentTool.pricing.tokens[0]?.symbol || 'USDC'}</p>
                    </div>
                  </div>
                </div>

                {/* Trial Result */}
                {trialResults[currentTool.name] && (
                  <div className={`rounded-lg border p-4 space-y-2 ${
                    trialResults[currentTool.name].success 
                      ? 'border-green-500 bg-green-50 dark:bg-green-950' 
                      : 'border-red-500 bg-red-50 dark:bg-red-950'
                  }`}>
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      {trialResults[currentTool.name].success ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          Response
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-red-600" />
                          Error
                        </>
                      )}
                    </h4>
                    <pre className="text-xs overflow-x-auto bg-background p-2 rounded max-h-40 overflow-y-auto">
                      {JSON.stringify(
                        trialResults[currentTool.name].success 
                          ? trialResults[currentTool.name].data 
                          : trialResults[currentTool.name].error, 
                        null, 
                        2
                      )}
                    </pre>
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2">
                <Button 
                  variant="outline" 
                  onClick={closeTrialDialog}
                  disabled={trialLoading[currentTool.name]}
                >
                  Close
                </Button>
                <Button 
                  onClick={() => handleTrialCall(currentTool)}
                  disabled={trialLoading[currentTool.name]}
                >
                  {trialLoading[currentTool.name] ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Run Trial
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
