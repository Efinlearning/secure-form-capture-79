
import { Shield, Settings, Database, Wifi, WifiOff } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";

export function AppSidebar() {
  const [isConnected, setIsConnected] = useState(false);
  const serverUrl = "ws://localhost:3000";
  const { connectionStatus } = useWebSocket(serverUrl);

  useEffect(() => {
    setIsConnected(connectionStatus === 'connected');
  }, [connectionStatus]);

  return (
    <Sidebar>
      <SidebarHeader className="flex items-center p-4">
        <Shield className="h-6 w-6 text-primary mr-2" />
        <h1 className="text-xl font-bold">SecureCapture</h1>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Credentials">
                  <a href="/">
                    <Database />
                    <span>Credentials</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-4 py-2">
              <div className="mb-4">
                <h3 className="text-sm font-medium mb-2">Server Connection</h3>
                <div className="flex items-center gap-2 mb-1">
                  {isConnected ? (
                    <>
                      <Wifi className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-500">Connected</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-red-500">Disconnected</span>
                    </>
                  )}
                </div>
                <div className="bg-secondary text-secondary-foreground px-3 py-1 rounded text-xs mb-2">
                  {serverUrl}
                </div>
              </div>
              
              <div className="mb-4">
                <h3 className="text-sm font-medium mb-2">About</h3>
                <p className="text-xs text-muted-foreground">
                  SecureCapture automatically captures form data from login and 
                  signup pages and securely transmits it to the server.
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Version</h3>
                <Badge variant="outline" className="text-xs">v1.0.1</Badge>
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="flex items-center justify-center text-xs text-muted-foreground">
          <span>© 2025 SecureCapture</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
