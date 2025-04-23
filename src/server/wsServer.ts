
import { WebSocketServer } from 'ws';

export function setupWebSocketServer(server: any) {
  const wss = new WebSocketServer({ server });

  console.log('WebSocket server integrated with Vite server');

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

  return wss;
}
