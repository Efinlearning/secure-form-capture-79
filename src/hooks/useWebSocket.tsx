import { useState, useEffect, useCallback, useRef } from 'react';

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

export const useWebSocket = (url: string, autoReconnect = true) => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [lastMessage, setLastMessage] = useState<MessageEvent | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const messageQueueRef = useRef<any[]>([]);
  const reconnectAttemptsRef = useRef<number>(0);
  const maxReconnectAttempts = 3;

  const connect = useCallback(() => {
    try {
      // Check if we've exceeded the max reconnect attempts
      if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
        console.log('Max reconnect attempts reached, stopping reconnection attempts');
        setConnectionStatus('disconnected');
        setError(new Error('Failed to connect after multiple attempts'));
        return;
      }
      
      const ws = new WebSocket(url);
      
      ws.onopen = () => {
        console.log('WebSocket connection established');
        setConnectionStatus('connected');
        setError(null);
        reconnectAttemptsRef.current = 0;
        
        // Send any queued messages
        while (messageQueueRef.current.length > 0) {
          const message = messageQueueRef.current.shift();
          if (message && ws.readyState === WebSocket.OPEN) {
            try {
              ws.send(typeof message === 'string' ? message : JSON.stringify(message));
            } catch (err) {
              console.error('Error sending queued message:', err);
            }
          }
        }
        
        // Clear any reconnection timeout
        if (reconnectTimeoutRef.current !== null) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };
      
      ws.onmessage = (event) => {
        try {
          console.log('Message received:', event.data);
          setLastMessage(event);
        } catch (err) {
          console.error('Error processing received message:', err);
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError(new Error('Connection error'));
        // We'll handle the reconnection in onclose
      };
      
      ws.onclose = (event) => {
        console.log('WebSocket connection closed. Code:', event.code, 'Reason:', event.reason);
        setConnectionStatus('disconnected');
        wsRef.current = null;
        
        // Attempt to reconnect after a delay if autoReconnect is enabled
        if (autoReconnect && reconnectTimeoutRef.current === null) {
          reconnectAttemptsRef.current += 1;
          const reconnectDelay = Math.min(3000 * reconnectAttemptsRef.current, 10000);
          
          console.log(`Reconnection attempt ${reconnectAttemptsRef.current} in ${reconnectDelay}ms`);
          
          reconnectTimeoutRef.current = window.setTimeout(() => {
            reconnectTimeoutRef.current = null;
            if (autoReconnect) {
              setConnectionStatus('connecting');
              connect();
            }
          }, reconnectDelay);
        }
      };
      
      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      setConnectionStatus('disconnected');
      setError(new Error('Failed to initialize WebSocket connection'));
      
      // Attempt to reconnect after a delay if autoReconnect is enabled
      if (autoReconnect && reconnectTimeoutRef.current === null) {
        reconnectAttemptsRef.current += 1;
        const reconnectDelay = Math.min(3000 * reconnectAttemptsRef.current, 10000);
        
        reconnectTimeoutRef.current = window.setTimeout(() => {
          reconnectTimeoutRef.current = null;
          if (autoReconnect) {
            setConnectionStatus('connecting');
            connect();
          }
        }, reconnectDelay);
      }
    }
  }, [url, autoReconnect]);
  
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (err) {
        console.error('Error closing WebSocket:', err);
      }
      wsRef.current = null;
    }
    
    if (reconnectTimeoutRef.current !== null) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);
  
  const sendMessage = useCallback((data: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      wsRef.current.send(message);
      return true;
    } else {
      // Queue the message for later when connection is established
      messageQueueRef.current.push(data);
      // Try to connect if not already connected
      if (!wsRef.current && autoReconnect) {
        connect();
      }
      return false;
    }
  }, [connect, autoReconnect]);
  
  useEffect(() => {
    connect();
    
    return () => {
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch (err) {
          console.error('Error closing WebSocket:', err);
        }
        wsRef.current = null;
      }
      
      if (reconnectTimeoutRef.current !== null) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [connect]);
  
  return {
    connectionStatus,
    lastMessage,
    sendMessage,
    error,
  };
};
