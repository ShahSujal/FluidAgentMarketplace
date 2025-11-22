"use client"

import * as React from "react"
import {
  IconCamera,
  IconDashboard,
  IconFileAi,
  IconFileDescription,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconSearch,
  IconSettings,
  IconUsers,
  IconWallet,
  IconRobot,
  IconMessageChatbot,
  IconRobotFace
} from "@tabler/icons-react"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Ghost } from "lucide-react"

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Marketplace",
      url: "/marketplace",
      icon: IconDashboard,
    },
    {
      title: "Fluid Chat",
      url: "/chat",
      icon: IconMessageChatbot,
    },
    {
      title: "My Agents",
      url: "/agents",
      icon: IconRobotFace,
    },
    {
      title: "Fluid Wallet",
      url: "/wallet",
      icon: IconWallet,
    },

  ],
  navClouds: [
    {
      title: "Capture",
      icon: IconCamera,
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: IconFileDescription,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: IconFileAi,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
  ],


}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props} className="py-10  bg-[#ffffff]">
      <SidebarHeader>
        <SidebarMenu  className="rounded-t-3xl ">
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <Ghost />
                <span className="text-lg font-sans font-semibold">Fluid Agent</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
 
      </SidebarContent>
      <SidebarFooter>
        <NavUser  />
      </SidebarFooter>
    </Sidebar>
  )
}
