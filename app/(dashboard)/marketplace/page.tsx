"use client"

import { useState, useMemo, useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { MCPServerCard } from "@/components/mcp-server-card"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Input } from "@/components/ui/input"
import { Search, Loader2 } from "lucide-react"
import { AgentDataType, fetchAgents } from "@/lib/graphql/client"

export default function Page() {
  const [mcpServers, setMcpServers] = useState<AgentDataType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Fetch agents from GraphQL
  useEffect(() => {
    const loadAgents = async () => {
      setLoading(true)
      setError(null)
      try {
        const fetchedAgents = await fetchAgents(50, 'totalFeedback', 'desc')
        setMcpServers(fetchedAgents)
      } catch (err) {
        console.error('Failed to load agents:', err)
        setError('Failed to load agents from the network. Please check your GraphQL endpoint.')
      } finally {
        setLoading(false)
      }
    }
    
    loadAgents()
  }, [])

  // Filter servers based on search query
  const filteredServers = useMemo(() => {
    if (!searchQuery.trim()) return mcpServers

    const query = searchQuery.toLowerCase()
    
    return mcpServers.filter((agent) => {
      const regFile = agent.registrationFile
      
      // Search in server name and description
      if (regFile.name.toLowerCase().includes(query) || 
          regFile.description.toLowerCase().includes(query)) {
        return true
      }
      
      // Search in tools
      const toolMatch = regFile.mcpTools.some((tool: string) => 
        tool.toLowerCase().includes(query)
      )
      
      // Search in prompts
      const promptMatch = regFile.mcpPrompts.some((prompt: string) => 
        prompt.toLowerCase().includes(query)
      )
      
      // Search in resources (check if they're JSON strings)
      const resourceMatch = regFile.mcpResources.some((resource: string) => {
        try {
          const parsed = JSON.parse(resource)
          return parsed.name?.toLowerCase().includes(query) || 
                 parsed.description?.toLowerCase().includes(query)
        } catch {
          return resource.toLowerCase().includes(query)
        }
      })
      
      return toolMatch || promptMatch || resourceMatch
    })
  }, [searchQuery, mcpServers])

  return (

        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-6 p-4 md:p-6">
              <div className="space-y-3 text-center max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold tracking-tight bg-linear-to-r from-blue-200 to-blue-900 bg-clip-text text-transparent">
                  Agentic Marketplace
                </h1>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Discover, deploy, and monetize AI agents powered by the Model Context Protocol. 
                  Browse a curated collection of intelligent agents with built-in tools, prompts, and resources 
                  that seamlessly integrate into your applications.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground pt-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary/60"></div>
                    <span>Pay-per-use with x402</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary/60"></div>
                    <span>Community ratings & feedback</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary/60"></div>
                    <span>Instant deployment</span>
                  </div>
                </div>
              </div>

              {/* Search Bar */}
              <div className="max-w-2xl mx-auto w-full">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Search by tools, prompts, resources, or server name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-12 text-base"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Loading State */}
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Loading agents...</span>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="max-w-2xl mx-auto w-full">
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              )}

              {/* Results Count */}
              {!loading && searchQuery && (
                <p className="text-sm text-muted-foreground text-center">
                  Found {filteredServers.length} {filteredServers.length === 1 ? 'server' : 'servers'}
                </p>
              )}

              
              {!loading && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredServers.length > 0 ? (
                    filteredServers.map((agent) => (
                      <MCPServerCard key={agent.id} data={agent} id={agent.id} />
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12">
                      <p className="text-muted-foreground">No servers found matching your search.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
  )
}
