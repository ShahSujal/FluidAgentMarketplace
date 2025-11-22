"use client"
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import Image from "next/image";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex h-screen w-full flex-1 flex-col relative">
                <div className="absolute inset-0 grayscale">
              <Image
                src="/marketagent.png"
                alt="Background"
                fill
                className="object-cover opacity-10"
                priority
                quality={100}
              />
              {/* <div className="absolute inset-0 bg-background/95 backdrop-blur-sm"></div> */}
            </div>
          <ScrollArea >
            {children}
            </ScrollArea>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
