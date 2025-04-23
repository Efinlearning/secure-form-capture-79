
// This is a simple mock server for testing WebSocket communication
// In a real application, you would have a proper Node.js server

import { WebSocketServer } from 'ws';

// Create a WebSocket server
const wss = new WebSocketServer({ port: 3000 });

console.log('WebSocket server started on port 3000');

// Store connected clients
const clients = new Set();

// Store credentials
const credentials = [];

// Handle WebSocket connections
wss.on('connection', (ws) => {
  console.log('Client connected');
  clients.add(ws);
  
  // Send current credentials to the new client
  if (credentials.length > 0) {
    ws.send(JSON.stringify({
      type: 'credentials',
      credentials
    }));
  }
  
  // Handle messages from clients
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('Received:', data);
      
      // Handle new credential
      if (data.type === 'NEW_CREDENTIAL') {
        credentials.push(data.credential);
        
        // Broadcast to all connected clients
        clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocketServer.OPEN) {
            client.send(JSON.stringify({
              type: 'credentials',
              credentials: [data.credential]
            }));
          }
        });
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });
  
  // Handle client disconnection
  ws.on('close', () => {
    console.log('Client disconnected');
    clients.delete(ws);
  });
});

// Handle server shutdown
process.on('SIGINT', () => {
  wss.close(() => {
    console.log('WebSocket server shut down');
    process.exit(0);
  });
});
