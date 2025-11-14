import { AppSidebar } from "@/components/app-sidebar"
import { MCPServerDetail } from "@/components/mcp-server-detail"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

import mcpData from "../mcp-data.json"

export default function MCPDetailPage() {
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
          <div className="@container/main flex flex-1 flex-col gap-2 p-4 md:p-6">
            <MCPServerDetail data={mcpData} />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
