
import { useState } from "react";
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { 
  ChevronDown, 
  ChevronUp, 
  ExternalLink, 
  Key, 
  Mail, 
  User, 
  Copy, 
  Download,
  Clipboard 
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Credential } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

interface CredentialsListProps {
  credentials: Credential[];
  onRefresh?: () => void;
}

export const CredentialsList = ({ credentials, onRefresh }: CredentialsListProps) => {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const toggleItem = (id: string) => {
    setOpenItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const copyCredential = (credential: Credential) => {
    const text = credential.fields.map(field => 
      `${field.name || field.type}: ${field.value}`
    ).join('\n');
    
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied to clipboard",
        description: "Credential details have been copied to your clipboard.",
        duration: 3000,
      });
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    });
  };

  const downloadCredential = (credential: Credential) => {
    const data = {
      url: credential.url,
      title: credential.title,
      timestamp: credential.timestamp,
      fields: credential.fields,
      isAutoFill: credential.isAutoFill
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `credential-${credential.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Credential downloaded",
      description: "Credential details have been saved as JSON file.",
      duration: 3000,
    });
  };

  const downloadAllCredentials = () => {
    if (credentials.length === 0) return;
    
    const data = credentials.map(cred => ({
      url: cred.url,
      title: cred.title,
      timestamp: cred.timestamp,
      fields: cred.fields,
      isAutoFill: cred.isAutoFill
    }));
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `all-credentials-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "All credentials downloaded",
      description: `${credentials.length} credential(s) have been saved as JSON file.`,
      duration: 3000,
    });
  };

  const copyAllCredentials = () => {
    if (credentials.length === 0) return;
    
    const text = credentials.map(cred => {
      const header = `URL: ${cred.url}\nTimestamp: ${new Date(cred.timestamp).toLocaleString()}\n`;
      const fields = cred.fields.map(field => 
        `${field.name || field.type}: ${field.value}`
      ).join('\n');
      return `${header}${fields}\n${'='.repeat(40)}`;
    }).join('\n\n');
    
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "All copied to clipboard",
        description: `${credentials.length} credential(s) have been copied to your clipboard.`,
        duration: 3000,
      });
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    });
  };

  if (credentials.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <p>No credentials captured yet.</p>
        <p className="text-sm mt-2">Credentials will appear here as you visit login/signup pages.</p>
        {onRefresh && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRefresh}
            className="mt-4"
          >
            Refresh Data
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-end gap-2 mb-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={copyAllCredentials}
          className="flex items-center gap-1"
        >
          <Clipboard className="h-4 w-4" />
          Copy All
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={downloadAllCredentials}
          className="flex items-center gap-1"
        >
          <Download className="h-4 w-4" />
          Download All
        </Button>
        {onRefresh && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRefresh}
            className="flex items-center gap-1"
          >
            Refresh
          </Button>
        )}
      </div>
      <ScrollArea className="h-[300px] rounded-md border p-0">
        <div className="p-0">
          {credentials.map((credential) => (
            <Collapsible 
              key={credential.id} 
              open={openItems[credential.id]} 
              onOpenChange={() => toggleItem(credential.id)}
              className="credential-item p-3 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <div className="font-medium truncate max-w-[250px]">{credential.url}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(credential.timestamp), { addSuffix: true })}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(credential.url, '_blank');
                    }}
                    className="h-8 w-8 p-0"
                    title="Open URL"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyCredential(credential);
                    }}
                    className="h-8 w-8 p-0"
                    title="Copy credential"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadCredential(credential);
                    }}
                    className="h-8 w-8 p-0"
                    title="Download credential"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      {openItems[credential.id] ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                </div>
              </div>
              
              <CollapsibleContent className="mt-2">
                <div className="space-y-2 rounded-md bg-muted/50 p-2">
                  {credential.fields.map((field, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      {field.type === 'email' && <Mail className="h-4 w-4 text-blue-500" />}
                      {field.type === 'password' && <Key className="h-4 w-4 text-red-500" />}
                      {(field.type === 'text' || field.type === 'username') && <User className="h-4 w-4 text-green-500" />}
                      <div className="flex-1">
                        <span className="text-xs font-medium">{field.name || field.type}:</span>
                        <span className="ml-1 text-xs">{field.value}</span>
                      </div>
                    </div>
                  ))}
                  <div className="text-xs text-muted-foreground mt-1">
                    {credential.isAutoFill ? "Auto-filled" : "Manually entered"}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
