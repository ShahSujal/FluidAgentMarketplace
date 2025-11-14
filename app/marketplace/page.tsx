"use client"

import { useState, useMemo } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { MCPServerCard } from "@/components/mcp-server-card"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

import mcpData from "./mcp-data.json"

export default function Page() {
  // You can replicate this data or add more MCP servers here
  const mcpServers = [mcpData, mcpData, mcpData, mcpData]
  const [searchQuery, setSearchQuery] = useState("")

  // Filter servers based on search query
  const filteredServers = useMemo(() => {
    if (!searchQuery.trim()) return mcpServers

    const query = searchQuery.toLowerCase()
    
    return mcpServers.filter((server, index) => {
      const endpoint = server.endpoints[0]
      
      // Search in server name and description
      if (server.name.toLowerCase().includes(query) || 
          server.description.toLowerCase().includes(query)) {
        return true
      }
      
      // Search in tools
      const toolMatch = endpoint.mcpTools.some(tool => 
        tool.name.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query)
      )
      
      // Search in prompts
      const promptMatch = endpoint.mcpPrompts.some(prompt => 
        prompt.name.toLowerCase().includes(query) ||
        prompt.description.toLowerCase().includes(query)
      )
      
      // Search in resources
      const resourceMatch = endpoint.mcpResources.some(resource => 
        resource.name.toLowerCase().includes(query) ||
        resource.description.toLowerCase().includes(query)
      )
      
      return toolMatch || promptMatch || resourceMatch
    })
  }, [searchQuery, mcpServers])

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
            <div className="flex flex-col gap-6 p-4 md:p-6">
              <div className="space-y-2 text-center">
                <h1 className="text-3xl font-bold tracking-tight">MCP MarketPlace</h1>
                <p className="text-muted-foreground">
                  Discover and integrate Model Context Protocol servers for your applications
                </p>
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
                  />
                </div>
              </div>

              {/* Results Count */}
              {searchQuery && (
                <p className="text-sm text-muted-foreground text-center">
                  Found {filteredServers.length} {filteredServers.length === 1 ? 'server' : 'servers'}
                </p>
              )}

              
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredServers.length > 0 ? (
                  filteredServers.map((server, index) => (
                    <MCPServerCard key={index} data={server} id={`mcp-${index + 1}`} />
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <p className="text-muted-foreground">No servers found matching your search.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
