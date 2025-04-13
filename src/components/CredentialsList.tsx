
import { useState } from "react";
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, ExternalLink, Key, Mail, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Credential } from "@/lib/types";

interface CredentialsListProps {
  credentials: Credential[];
}

export const CredentialsList = ({ credentials }: CredentialsListProps) => {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const toggleItem = (id: string) => {
    setOpenItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  if (credentials.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <p>No credentials captured yet.</p>
        <p className="text-sm mt-2">Credentials will appear here as you visit login/signup pages.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[350px] rounded-md border p-0">
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
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(credential.url, '_blank');
                  }}
                  className="h-8 w-8 p-0"
                >
                  <ExternalLink className="h-4 w-4" />
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
  );
};
