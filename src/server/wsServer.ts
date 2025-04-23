
import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage, Server } from 'http';
import { Credential } from '../lib/types';

export function setupWebSocketServer(server: Server) {
  const wss = new WebSocketServer({ 
    server,
    // Add these options for better error handling
    perMessageDeflate: false,
    maxPayload: 2 * 1024 * 1024, // 2MB max message size
  });

  console.log('WebSocket server integrated with Vite server');

  // Store connected clients
  const clients = new Set<WebSocket>();

  // Store credentials
  const credentials: Credential[] = [];

  // Handle WebSocket connections
  wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
    console.log('Client connected');
    clients.add(ws);
    
    // Send current credentials to the new client
    if (credentials.length > 0) {
      try {
        ws.send(JSON.stringify({
          type: 'credentials',
          credentials
        }));
      } catch (err) {
        console.error('Error sending credentials to client:', err);
      }
    }
    
    // Handle messages from clients
    ws.on('message', (message: WebSocket.Data) => {
      try {
        const messageStr = message.toString();
        // Check if the message is valid JSON
        if (!messageStr.trim().startsWith('{') && !messageStr.trim().startsWith('[')) {
          console.warn('Received non-JSON message, ignoring');
          return;
        }
        
        const data = JSON.parse(messageStr);
        console.log('Received:', data);
        
        // Handle new credential
        if (data.type === 'NEW_CREDENTIAL') {
          credentials.push(data.credential);
          
          // Broadcast to all connected clients
          clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              try {
                client.send(JSON.stringify({
                  type: 'credentials',
                  credentials: [data.credential]
                }));
              } catch (err) {
                console.error('Error broadcasting to client:', err);
              }
            }
          });
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });
    
    // Handle errors with better logging
    ws.on('error', (error) => {
      console.error('WebSocket connection error:', error);
    });
    
    // Handle client disconnection
    ws.on('close', (code, reason) => {
      console.log(`Client disconnected. Code: ${code}, Reason: ${reason || 'No reason provided'}`);
      clients.delete(ws);
    });
  });

  // Handle server errors
  wss.on('error', (error) => {
    console.error('WebSocket server error:', error);
  });

  // Heartbeat to prevent timeouts
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    });
  }, 30000);

  // Clean up on server close
  wss.on('close', () => {
    clearInterval(interval);
  });

  return wss;
}
