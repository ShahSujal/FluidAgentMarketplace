"use client"

import { useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bot, Zap, Code, FileText, CheckCircle2, ArrowRight, Loader2, ExternalLink, DollarSign } from "lucide-react"
import { createAgentPayload } from "@/lib/scripts/create"
import { toast } from "sonner"
// import { createAgentPayload } from "@/lib/scripts/create"

interface Tool {
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
}

interface Prompt {
  name: string
  description: string
  parameters: Array<{
    name: string
    description: string
    required: boolean
  }>
}

interface Resource {
  name: string
  uri: string
  description: string
  mimeType: string
}

export default function AgentsPage() {
  const [mcpUrl, setMcpUrl] = useState("")
  const [agentName, setAgentName] = useState("")
  const [agentDescription, setAgentDescription] = useState("")
  const [agentWalletAddress, setAgentWalletAddress] = useState("")
  const [agentImage, setAgentImage] = useState("")
  const [category, setCategory] = useState<string[]>([])
  const [categoryInput, setCategoryInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [tools, setTools] = useState<Tool[]>([])
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [dataFetched, setDataFetched] = useState(false)
  const [selectedTools, setSelectedTools] = useState<string[]>([])
  const [selectedPrompts, setSelectedPrompts] = useState<string[]>([])
  const [selectedResources, setSelectedResources] = useState<string[]>([])

  const fetchMCPData = async () => {
    if (!mcpUrl.trim()) {
      setError("Please enter a valid MCP server URL")
      return
    }

    setLoading(true)
    setError("")

    try {
      const baseUrl = mcpUrl.endsWith('/') ? mcpUrl.slice(0, -1) : mcpUrl

      // Fetch tools, prompts, and resources
      const [toolsRes, promptsRes, resourcesRes] = await Promise.all([
        fetch(`${baseUrl}/tools`),
        fetch(`${baseUrl}/prompts`),
        fetch(`${baseUrl}/resources`)
      ])

      if (!toolsRes.ok || !promptsRes.ok || !resourcesRes.ok) {
        throw new Error("Failed to fetch MCP data from the provided URL")
      }

      const toolsData = await toolsRes.json()
      const promptsData = await promptsRes.json()
      const resourcesData = await resourcesRes.json()

      setTools(toolsData)
      setPrompts(promptsData)
      setResources(resourcesData)
      setDataFetched(true)
      setError("")
    } catch (err) {
      setError("Failed to fetch data from MCP server. Please check the URL and try again.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const toggleTool = (toolName: string) => {
    setSelectedTools(prev =>
      prev.includes(toolName)
        ? prev.filter(name => name !== toolName)
        : [...prev, toolName]
    )
  }

  const togglePrompt = (promptName: string) => {
    setSelectedPrompts(prev =>
      prev.includes(promptName)
        ? prev.filter(name => name !== promptName)
        : [...prev, promptName]
    )
  }

  const toggleResource = (resourceName: string) => {
    setSelectedResources(prev =>
      prev.includes(resourceName)
        ? prev.filter(name => name !== resourceName)
        : [...prev, resourceName]
    )
  }

  const handleCreateAgent = async () => {
   try {
     const selectedToolsData = tools.filter(t => selectedTools.includes(t.name))
    const selectedPromptsData = prompts.filter(p => selectedPrompts.includes(p.name))
    const selectedResourcesData = resources.filter(r => selectedResources.includes(r.name))


    const agent = await createAgentPayload({
        agentName: agentName,
        agentDescription: agentDescription,
        MCP_SERVER_URL: mcpUrl,
        MCP_PROTOCOL_VERSION: "1.0",
        chainId: selectedToolsData[0]?.pricing?.chainId || 1,
        agentWalletAddress: agentWalletAddress,
        category: category, 
        agentImage: agentImage,
    })
      toast("Agent Created Successfully", {
          description: `Your agent has been created successfully. Agent ID: ${agent}`,
          action: {
            label: "Undo",
            onClick: () => console.log("Undo"),
          },
        })
    console.log({agent});
    

    console.log({
      name: agentName,
      description: agentDescription,
      mcpUrl,
      walletAddress: agentWalletAddress,
      image: agentImage,
      category: category,
      tools: selectedToolsData,
      prompts: selectedPromptsData,
      resources: selectedResourcesData
    })
    // Handle agent creation logic here
   } catch (error) {
    console.log(error);
    toast.error("Failed to create agent. Please try again.");
   }
  }

  const addCategory = () => {
    if (categoryInput.trim() && !category.includes(categoryInput.trim())) {
      setCategory([...category, categoryInput.trim()])
      setCategoryInput("")
    }
  }

  const removeCategory = (categoryToRemove: string) => {
    setCategory(category.filter(cat => cat !== categoryToRemove))
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-6 p-4 md:p-8 max-w-5xl mx-auto w-full">
              {/* Header */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <Bot className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">Create Your Agent</h1>
                    <p className="text-muted-foreground">
                      Build and deploy your MCP agent in minutes
                    </p>
                  </div>
                </div>
              </div>

              {/* Steps Indicator */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                <Badge variant="default" className="gap-2 px-4 py-2">
                  <CheckCircle2 className="h-4 w-4" />
                  1. Basic Info
                </Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline" className="gap-2 px-4 py-2">
                  2. Configure Tools
                </Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline" className="gap-2 px-4 py-2">
                  3. Deploy
                </Badge>
              </div>

              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">
                    <FileText className="h-4 w-4 mr-2" />
                    Basic Info
                  </TabsTrigger>
                  <TabsTrigger value="tools">
                    <Zap className="h-4 w-4 mr-2" />
                    Tools & Features
                  </TabsTrigger>
                  <TabsTrigger value="config">
                    <Code className="h-4 w-4 mr-2" />
                    Configuration
                  </TabsTrigger>
                </TabsList>

                {/* Basic Info Tab */}
                <TabsContent value="basic" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>MCP Server URL</CardTitle>
                      <CardDescription>
                        Enter your MCP server URL to fetch available tools, prompts, and resources
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="mcp-url">MCP Server URL *</Label>
                        <div className="flex gap-2">
                          <Input
                            id="mcp-url"
                            placeholder="e.g., https://fluidmcpserver.vercel.app/mcp"
                            value={mcpUrl}
                            onChange={(e) => setMcpUrl(e.target.value)}
                            className="h-12"
                            disabled={dataFetched}
                          />
                          <Button 
                            onClick={fetchMCPData} 
                            disabled={loading || dataFetched}
                            className="h-12 px-6"
                          >
                            {loading ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Fetching...
                              </>
                            ) : dataFetched ? (
                              <>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Loaded
                              </>
                            ) : (
                              "Fetch Data"
                            )}
                          </Button>
                        </div>
                        {error && (
                          <p className="text-xs text-destructive">{error}</p>
                        )}
                        {dataFetched && (
                          <p className="text-xs text-green-600">
                            ✓ Successfully loaded {tools.length} tools, {prompts.length} prompts, and {resources.length} resources
                          </p>
                        )}
                      </div>

                      {dataFetched && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="agent-name">Agent Name *</Label>
                            <Input
                              id="agent-name"
                              placeholder="e.g., My Crypto Assistant"
                              value={agentName}
                              onChange={(e) => setAgentName(e.target.value)}
                              className="h-12"
                            />
                            <p className="text-xs text-muted-foreground">
                              Choose a memorable name for your agent
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="agent-description">Description *</Label>
                            <Input
                              id="agent-description"
                              placeholder="e.g., AI agent for crypto market analysis"
                              value={agentDescription}
                              onChange={(e) => setAgentDescription(e.target.value)}
                              className="h-12"
                            />
                            <p className="text-xs text-muted-foreground">
                              Brief description of what your agent does
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="agent-wallet">Agent Wallet Address *</Label>
                            <Input
                              id="agent-wallet"
                              placeholder="e.g., 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
                              value={agentWalletAddress}
                              onChange={(e) => setAgentWalletAddress(e.target.value)}
                              className="h-12 font-mono text-sm"
                            />
                            <p className="text-xs text-muted-foreground">
                              Ethereum wallet address for your agent
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="agent-image">Agent Image URL *</Label>
                            <Input
                              id="agent-image"
                              placeholder="e.g., https://example.com/image.jpg"
                              value={agentImage}
                              onChange={(e) => setAgentImage(e.target.value)}
                              className="h-12"
                            />
                            <p className="text-xs text-muted-foreground">
                              URL to your agent's profile image
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="category-input">Categories (Tags)</Label>
                            <div className="flex gap-2">
                              <Input
                                id="category-input"
                                placeholder="e.g., DeFi, Trading, Analytics"
                                value={categoryInput}
                                onChange={(e) => setCategoryInput(e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault()
                                    addCategory()
                                  }
                                }}
                                className="h-12"
                              />
                              <Button 
                                type="button"
                                onClick={addCategory}
                                className="h-12 px-6"
                              >
                                Add
                              </Button>
                            </div>
                            {category.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {category.map((cat, idx) => (
                                  <Badge 
                                    key={idx} 
                                    variant="secondary"
                                    className="gap-1 px-3 py-1"
                                  >
                                    {cat}
                                    <button
                                      type="button"
                                      onClick={() => removeCategory(cat)}
                                      className="ml-1 hover:text-destructive"
                                    >
                                      ×
                                    </button>
                                  </Badge>
                                ))}
                              </div>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Add tags to help users discover your agent
                            </p>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  {!dataFetched && (
                    <Card className="border-dashed">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <div className="p-2 rounded-lg bg-blue-500/10">
                            <Zap className="h-5 w-5 text-blue-500" />
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-sm font-semibold">How it works</h4>
                            <p className="text-sm text-muted-foreground">
                              Enter your MCP server URL and we'll automatically fetch all available tools, prompts, and resources. You can then select which ones to include in your agent.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Tools Tab */}
                <TabsContent value="tools" className="space-y-6">
                  {!dataFetched ? (
                    <Card>
                      <CardContent className="pt-6 text-center py-12">
                        <p className="text-muted-foreground">
                          Please fetch MCP data first from the Basic Info tab
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      <Tabs defaultValue="tools-list" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="tools-list">
                            <Zap className="h-4 w-4 mr-2" />
                            Tools ({tools.length})
                          </TabsTrigger>
                          <TabsTrigger value="prompts-list">
                            <FileText className="h-4 w-4 mr-2" />
                            Prompts ({prompts.length})
                          </TabsTrigger>
                          <TabsTrigger value="resources-list">
                            <Code className="h-4 w-4 mr-2" />
                            Resources ({resources.length})
                          </TabsTrigger>
                        </TabsList>

                        {/* Tools List */}
                        <TabsContent value="tools-list" className="space-y-4">
                          {tools.map((tool) => (
                            <Card
                              key={tool.name}
                              className={`cursor-pointer transition-all ${
                                selectedTools.includes(tool.name)
                                  ? 'border-primary bg-primary/5'
                                  : 'hover:border-primary/50'
                              }`}
                              onClick={() => toggleTool(tool.name)}
                            >
                              <CardHeader>
                                <div className="flex items-start justify-between">
                                  <div className="space-y-1 flex-1">
                                    <div className="flex items-center gap-2">
                                      <CardTitle className="text-lg">{tool.name}</CardTitle>
                                      {selectedTools.includes(tool.name) && (
                                        <CheckCircle2 className="h-5 w-5 text-primary" />
                                      )}
                                    </div>
                                    <CardDescription>{tool.description}</CardDescription>
                                  </div>
                                  <Badge variant="secondary" className="gap-1.5">
                                    <DollarSign className="h-3 w-3" />
                                    {tool.pricing.price}
                                  </Badge>
                                </div>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                {/* Endpoint */}
                                <div className="rounded-lg bg-muted p-3">
                                  <p className="text-xs text-muted-foreground mb-1">Endpoint</p>
                                  <code className="text-sm">{tool.endpoint}</code>
                                </div>

                                {/* Parameters */}
                                <div className="space-y-2">
                                  <h4 className="text-sm font-semibold">Parameters</h4>
                                  <div className="space-y-2">
                                    {tool.parameters.map((param, idx) => (
                                      <div key={idx} className="flex items-start gap-2 text-sm">
                                        <Badge variant={param.required ? "default" : "outline"} className="text-xs">
                                          {param.required ? "Required" : "Optional"}
                                        </Badge>
                                        <code className="text-xs font-medium">{param.name}</code>
                                        <span className="text-xs text-muted-foreground">({param.type})</span>
                                        <span className="text-xs text-muted-foreground flex-1">
                                          - {param.description}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Pricing Details */}
                                <div className="rounded-lg border p-3 space-y-2">
                                  <h4 className="text-sm font-semibold">Pricing Details</h4>
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                      <span className="text-muted-foreground">Network:</span>{" "}
                                      <span className="font-medium">{tool.pricing.network}</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Chain ID:</span>{" "}
                                      <span className="font-medium">{tool.pricing.chainId}</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Token:</span>{" "}
                                      <span className="font-medium">{tool.pricing.tokens[0].symbol}</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Price:</span>{" "}
                                      <span className="font-medium">{tool.pricing.price}</span>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                          {selectedTools.length > 0 && (
                            <div className="p-4 rounded-lg bg-muted">
                              <p className="text-sm font-semibold">
                                {selectedTools.length} tool{selectedTools.length > 1 ? 's' : ''} selected
                              </p>
                            </div>
                          )}
                        </TabsContent>

                        {/* Prompts List */}
                        <TabsContent value="prompts-list" className="space-y-4">
                          {prompts.map((prompt) => (
                            <Card
                              key={prompt.name}
                              className={`cursor-pointer transition-all ${
                                selectedPrompts.includes(prompt.name)
                                  ? 'border-primary bg-primary/5'
                                  : 'hover:border-primary/50'
                              }`}
                              onClick={() => togglePrompt(prompt.name)}
                            >
                              <CardHeader>
                                <div className="flex items-start justify-between">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <CardTitle className="text-lg">{prompt.name}</CardTitle>
                                      {selectedPrompts.includes(prompt.name) && (
                                        <CheckCircle2 className="h-5 w-5 text-primary" />
                                      )}
                                    </div>
                                    <CardDescription>{prompt.description}</CardDescription>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-2">
                                  <h4 className="text-sm font-semibold">Parameters</h4>
                                  <div className="space-y-2">
                                    {prompt.parameters.map((param, idx) => (
                                      <div key={idx} className="flex items-start gap-2 text-sm">
                                        <Badge variant={param.required ? "default" : "outline"} className="text-xs">
                                          {param.required ? "Required" : "Optional"}
                                        </Badge>
                                        <code className="text-xs font-medium">{param.name}</code>
                                        <span className="text-xs text-muted-foreground flex-1">
                                          - {param.description}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                          {selectedPrompts.length > 0 && (
                            <div className="p-4 rounded-lg bg-muted">
                              <p className="text-sm font-semibold">
                                {selectedPrompts.length} prompt{selectedPrompts.length > 1 ? 's' : ''} selected
                              </p>
                            </div>
                          )}
                        </TabsContent>

                        {/* Resources List */}
                        <TabsContent value="resources-list" className="space-y-4">
                          {resources.map((resource) => (
                            <Card
                              key={resource.name}
                              className={`cursor-pointer transition-all ${
                                selectedResources.includes(resource.name)
                                  ? 'border-primary bg-primary/5'
                                  : 'hover:border-primary/50'
                              }`}
                              onClick={() => toggleResource(resource.name)}
                            >
                              <CardHeader>
                                <div className="flex items-start justify-between">
                                  <div className="space-y-1 flex-1">
                                    <div className="flex items-center gap-2">
                                      <CardTitle className="text-lg">{resource.name}</CardTitle>
                                      {selectedResources.includes(resource.name) && (
                                        <CheckCircle2 className="h-5 w-5 text-primary" />
                                      )}
                                    </div>
                                    <CardDescription>{resource.description}</CardDescription>
                                  </div>
                                  <Badge variant="secondary" className="text-xs">
                                    {resource.mimeType}
                                  </Badge>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div className="rounded-lg bg-muted p-3">
                                  <p className="text-xs text-muted-foreground mb-1">URI</p>
                                  <code className="text-sm break-all">{resource.uri}</code>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                          {selectedResources.length > 0 && (
                            <div className="p-4 rounded-lg bg-muted">
                              <p className="text-sm font-semibold">
                                {selectedResources.length} resource{selectedResources.length > 1 ? 's' : ''} selected
                              </p>
                            </div>
                          )}
                        </TabsContent>
                      </Tabs>
                    </>
                  )}
                </TabsContent>

                {/* Configuration Tab */}
                <TabsContent value="config" className="space-y-6">
                  {!dataFetched ? (
                    <Card>
                      <CardContent className="pt-6 text-center py-12">
                        <p className="text-muted-foreground">
                          Please fetch MCP data first from the Basic Info tab
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      <Card>
                        <CardHeader>
                          <CardTitle>Selection Summary</CardTitle>
                          <CardDescription>
                            Review your selections before deploying
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid gap-4 md:grid-cols-3">
                            <div className="p-4 rounded-lg border">
                              <div className="flex items-center gap-2 mb-2">
                                <Zap className="h-4 w-4 text-primary" />
                                <h4 className="font-semibold">Tools</h4>
                              </div>
                              <p className="text-2xl font-bold">{selectedTools.length}</p>
                              <p className="text-xs text-muted-foreground">of {tools.length} available</p>
                            </div>
                            <div className="p-4 rounded-lg border">
                              <div className="flex items-center gap-2 mb-2">
                                <FileText className="h-4 w-4 text-primary" />
                                <h4 className="font-semibold">Prompts</h4>
                              </div>
                              <p className="text-2xl font-bold">{selectedPrompts.length}</p>
                              <p className="text-xs text-muted-foreground">of {prompts.length} available</p>
                            </div>
                            <div className="p-4 rounded-lg border">
                              <div className="flex items-center gap-2 mb-2">
                                <Code className="h-4 w-4 text-primary" />
                                <h4 className="font-semibold">Resources</h4>
                              </div>
                              <p className="text-2xl font-bold">{selectedResources.length}</p>
                              <p className="text-xs text-muted-foreground">of {resources.length} available</p>
                            </div>
                          </div>

                          <div className="rounded-lg bg-muted p-4 space-y-2">
                            <div className="flex items-center gap-2">
                              <ExternalLink className="h-4 w-4" />
                              <h4 className="text-sm font-semibold">MCP Server URL</h4>
                            </div>
                            <code className="text-sm break-all">{mcpUrl}</code>
                          </div>

                          <div className="space-y-3">
                            <h4 className="text-sm font-semibold">Agent Details</h4>
                            <div className="grid gap-3">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Name:</span>
                                <span className="font-medium">{agentName}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Wallet:</span>
                                <code className="text-xs font-mono">{agentWalletAddress.slice(0, 10)}...{agentWalletAddress.slice(-8)}</code>
                              </div>
                              {category.length > 0 && (
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Categories:</span>
                                  <div className="flex gap-1 flex-wrap justify-end">
                                    {category.map((cat, idx) => (
                                      <Badge key={idx} variant="outline" className="text-xs">
                                        {cat}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-primary/5 border-primary/20">
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-4">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <CheckCircle2 className="h-5 w-5 text-primary" />
                            </div>
                            <div className="space-y-1 flex-1">
                              <h4 className="text-sm font-semibold">Ready to Deploy</h4>
                              <p className="text-sm text-muted-foreground">
                                Your agent is configured with {selectedTools.length + selectedPrompts.length + selectedResources.length} features and ready to be deployed to the marketplace
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  )}
                </TabsContent>
              </Tabs>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-4 border-t">
                <Button variant="outline" size="lg" onClick={() => {
                  setDataFetched(false)
                  setTools([])
                  setPrompts([])
                  setResources([])
                  setSelectedTools([])
                  setSelectedPrompts([])
                  setSelectedResources([])
                  setMcpUrl("")
                  setAgentName("")
                  setAgentDescription("")
                  setAgentWalletAddress("")
                  setAgentImage("")
                  setCategory([])
                }}>
                  Reset
                </Button>
                <Button
                  size="lg"
                  onClick={handleCreateAgent}
                  disabled={!agentName || !agentDescription || !agentWalletAddress || !agentImage || !dataFetched || (selectedTools.length === 0 && selectedPrompts.length === 0 && selectedResources.length === 0)}
                  className="gap-2"
                >
                  <Bot className="h-4 w-4" />
                  Create Agent
                </Button>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}