
import { Credential } from "./types";

// Mock data for demonstration purposes
export const mockCredentials: Credential[] = [
  {
    id: "cred-1",
    url: "https://example.com/login",
    title: "Example Login",
    timestamp: Date.now() - 3600000, // 1 hour ago
    fields: [
      { type: "email", name: "email", value: "user@example.com" },
      { type: "password", name: "password", value: "secretpassword123" }
    ],
    isAutoFill: false
  },
  {
    id: "cred-2",
    url: "https://social-network.com/signup",
    title: "Social Network Signup",
    timestamp: Date.now() - 7200000, // 2 hours ago
    fields: [
      { type: "text", name: "username", value: "johndoe" },
      { type: "email", name: "email", value: "john.doe@example.com" },
      { type: "password", name: "password", value: "strongpassword!" }
    ],
    isAutoFill: false
  },
  {
    id: "cred-3",
    url: "https://shopping-site.com/account",
    title: "Shopping Site Login",
    timestamp: Date.now() - 86400000, // 1 day ago
    fields: [
      { type: "email", name: "email", value: "shopper@example.com" },
      { type: "password", name: "password", value: "shoppingPass$" }
    ],
    isAutoFill: true
  }
];
