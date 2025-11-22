"use client"

import { useEffect, useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { MCPServerDetail } from "@/components/mcp-server-detail"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { fetchAgentById, AgentDataType } from "@/lib/graphql/client"
import { Loader2 } from "lucide-react"
import { useParams } from "next/navigation"

export default function MCPDetailPage() {
  const params = useParams()
  const [agent, setAgent] = useState<AgentDataType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadAgent = async () => {
      console.log({
        params
      });
      
      if (!params.id) return
      
      setLoading(true)
      setError(null)
      
      try {
        // Extract agentId from the id format "84532:3" -> "3"
        const agentId = typeof params.id === 'string' 
          ? params.id.split(':').pop() || params.id 
          : params.id[0]
        
        const fetchedAgent = await fetchAgentById(agentId)
        
        if (!fetchedAgent) {
          setError('Agent not found')
        } else {
          setAgent(fetchedAgent)
        }
      } catch (err) {
        console.error('Failed to load agent:', err)
        setError('Failed to load agent details')
      } finally {
        setLoading(false)
      }
    }

    loadAgent()
  }, [params.id])

  return (

        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2 p-4 md:p-6">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading agent details...</span>
              </div>
            )}
            
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
                <p className="text-sm">{error}</p>
              </div>
            )}
            
            {agent && !loading && <MCPServerDetail data={agent} />}
          </div>
        </div>

  )
}
