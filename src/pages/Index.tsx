
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wifi, WifiOff, Shield, Trash2, RefreshCw } from "lucide-react";
import { CredentialsList } from "@/components/CredentialsList";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useToast } from "@/hooks/use-toast";
import { Credential } from "@/lib/types";

// For demo purposes only
import { mockCredentials } from "@/lib/mockData";

const Index = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [credentials, setCredentials] = useState<Credential[]>(mockCredentials);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  // In a real extension, this would connect to your actual server
  const serverUrl = "ws://localhost:3000";
  
  // Initialize WebSocket connection
  const { sendMessage, lastMessage, connectionStatus } = useWebSocket(serverUrl);

  useEffect(() => {
    setIsConnected(connectionStatus === 'connected');
    
    if (connectionStatus === 'connected') {
      toast({
        title: "Connected to server",
        description: "Successfully established connection with the server.",
        duration: 3000,
      });
    } else if (connectionStatus === 'disconnected') {
      toast({
        title: "Disconnected from server",
        description: "Connection to server lost. Trying to reconnect...",
        variant: "destructive",
        duration: 3000,
      });
    }
  }, [connectionStatus, toast]);

  useEffect(() => {
    // Handle incoming messages from the server
    if (lastMessage) {
      try {
        const data = JSON.parse(lastMessage.data);
        if (data.type === 'credentials') {
          // In a real extension, we would merge the new credentials with existing ones
          // Here we're just appending them
          setCredentials(prev => [...prev, ...data.credentials]);
          setIsRefreshing(false);
        }
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
        setIsRefreshing(false);
      }
    }
  }, [lastMessage]);

  const clearCredentials = () => {
    setCredentials([]);
    toast({
      title: "Credentials cleared",
      description: "All stored credentials have been cleared.",
      duration: 3000,
    });
  };

  const refreshCredentials = () => {
    setIsRefreshing(true);
    
    // In a real extension, this would request fresh data from the background script
    // For now, we'll just simulate a refresh with a timeout
    sendMessage({ type: 'GET_CREDENTIALS' });
    
    // Add a timeout to turn off the refreshing state if no response comes back
    setTimeout(() => {
      setIsRefreshing(false);
    }, 5000);
    
    toast({
      title: "Refreshing credentials",
      description: "Requesting latest credential data...",
      duration: 2000,
    });
  };

  return (
    <div className="chrome-extension p-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">SecureCapture</h1>
        </div>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <Wifi className="h-5 w-5 connection-status-connected" />
              <span className="text-sm connection-status-connected">Connected</span>
            </>
          ) : (
            <>
              <WifiOff className="h-5 w-5 connection-status-disconnected" />
              <span className="text-sm connection-status-disconnected">Disconnected</span>
            </>
          )}
        </div>
      </div>

      <Tabs defaultValue="credentials" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="credentials">
            Credentials
            <Badge variant="secondary" className="ml-2">
              {credentials.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="credentials">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Captured Credentials</CardTitle>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={refreshCredentials}
                  className="h-8"
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearCredentials}
                  className="h-8"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <CredentialsList 
                credentials={credentials} 
                onRefresh={refreshCredentials} 
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Connection Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-sm font-medium col-span-1">Server URL:</label>
                  <div className="col-span-3">
                    <span className="px-3 py-2 rounded-md bg-secondary text-sm block">
                      {serverUrl}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-sm font-medium col-span-1">Status:</label>
                  <div className="col-span-3">
                    {isConnected ? (
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                        <Wifi className="h-3 w-3 mr-1" />
                        Connected
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                        <WifiOff className="h-3 w-3 mr-1" />
                        Disconnected
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;
