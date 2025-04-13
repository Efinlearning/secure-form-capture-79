
import { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  Eye, 
  EyeOff, 
  Copy, 
  Globe, 
  Calendar, 
  User, 
  Lock, 
  Mail, 
  Key, 
  FileText, 
  AlertCircle 
} from "lucide-react";
import { 
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Credential } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

interface CredentialsListProps {
  credentials: Credential[];
  onRefresh: () => void;
}

export function CredentialsList({ credentials, onRefresh }: CredentialsListProps) {
  const [hiddenValues, setHiddenValues] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const toggleValueVisibility = (fieldId: string) => {
    setHiddenValues(prev => ({
      ...prev,
      [fieldId]: !prev[fieldId]
    }));
  };

  const copyToClipboard = (text: string, description: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied to clipboard",
        description: description,
        duration: 3000,
      });
    }).catch(err => {
      console.error('Failed to copy: ', err);
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive",
        duration: 3000,
      });
    });
  };

  const getFieldIcon = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('password')) return <Lock className="h-4 w-4 text-orange-500" />;
    if (lowerType.includes('email')) return <Mail className="h-4 w-4 text-blue-500" />;
    if (lowerType.includes('user') || lowerType.includes('name')) return <User className="h-4 w-4 text-green-500" />;
    if (lowerType.includes('otp') || lowerType.includes('code')) return <Key className="h-4 w-4 text-purple-500" />;
    return <FileText className="h-4 w-4 text-gray-500" />;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const truncateUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (e) {
      return url;
    }
  };

  if (credentials.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No credentials captured</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Credentials will appear here when you visit login or signup pages.
        </p>
        <Button onClick={onRefresh} size="sm" variant="outline">
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">Website</TableHead>
            <TableHead>Captured At</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {credentials.map((credential) => (
            <TableRow key={credential.id}>
              <TableCell className="font-medium">
                <div className="flex items-center">
                  <Globe className="h-4 w-4 mr-2 text-blue-500" />
                  <span className="truncate max-w-[120px]">
                    {truncateUrl(credential.url)}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-sm">{formatDate(credential.timestamp)}</span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Drawer>
                  <DrawerTrigger asChild>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader>
                      <DrawerTitle>Credential Details</DrawerTitle>
                    </DrawerHeader>
                    <div className="p-4">
                      <div className="mb-4">
                        <h3 className="text-sm font-medium mb-2">Website</h3>
                        <div className="flex items-center justify-between bg-secondary p-2 rounded">
                          <div className="flex items-center">
                            <Globe className="h-4 w-4 mr-2 text-blue-500" />
                            <span className="text-sm">{credential.url}</span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => copyToClipboard(credential.url, "URL copied to clipboard")}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <h3 className="text-sm font-medium mb-2">Captured At</h3>
                        <div className="flex items-center bg-secondary p-2 rounded">
                          <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                          <span className="text-sm">{formatDate(credential.timestamp)}</span>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium mb-2">Fields</h3>
                        <div className="space-y-2">
                          {credential.fields.map((field, index) => (
                            <div 
                              key={`${credential.id}-${field.name}-${index}`}
                              className="flex items-center justify-between bg-secondary p-2 rounded"
                            >
                              <div className="flex items-center">
                                {getFieldIcon(field.name)}
                                <span className="text-sm ml-2 mr-1 font-medium">
                                  {field.name}:
                                </span>
                                <span className="text-sm ml-1">
                                  {hiddenValues[`${credential.id}-${field.name}-${index}`] 
                                    ? field.value 
                                    : field.type === 'password' 
                                      ? '••••••••' 
                                      : field.value}
                                </span>
                              </div>
                              <div className="flex">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => toggleValueVisibility(`${credential.id}-${field.name}-${index}`)}
                                >
                                  {hiddenValues[`${credential.id}-${field.name}-${index}`] 
                                    ? <EyeOff className="h-4 w-4" /> 
                                    : <Eye className="h-4 w-4" />}
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => copyToClipboard(
                                    field.value, 
                                    `${field.name} value copied to clipboard`
                                  )}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </DrawerContent>
                </Drawer>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
