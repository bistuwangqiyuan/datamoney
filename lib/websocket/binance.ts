import { useEffect, useRef, useCallback } from 'react';
import { useMarketStore } from '@/lib/store/useMarketStore';
import { RECONNECT_DELAYS, MAX_RECONNECT_ATTEMPTS, HEARTBEAT_INTERVAL } from '@/lib/utils/constants';

export function useBinanceWebSocket(url: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout>();
  const lastMessageTimeRef = useRef<number>(Date.now());
  const { setConnected } = useMarketStore();

  const checkHeartbeat = useCallback(() => {
    const timeSinceLastMessage = Date.now() - lastMessageTimeRef.current;
    if (timeSinceLastMessage > HEARTBEAT_INTERVAL) {
      console.log('[WS] No message received, reconnecting...');
      disconnect();
      connect();
    } else {
      heartbeatTimeoutRef.current = setTimeout(checkHeartbeat, HEARTBEAT_INTERVAL);
    }
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      console.log('[WS] Connecting to:', url);
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WS] Connected');
        setConnected(true);
        reconnectAttemptRef.current = 0;
        lastMessageTimeRef.current = Date.now();
        heartbeatTimeoutRef.current = setTimeout(checkHeartbeat, HEARTBEAT_INTERVAL);
      };

      ws.onmessage = (event) => {
        lastMessageTimeRef.current = Date.now();
        try {
          const data = JSON.parse(event.data);
          // Message will be handled by specific hooks
          if (ws.onmessage) {
            (ws.onmessage as any)(event);
          }
        } catch (error) {
          console.error('[WS] Parse error:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('[WS] Error:', error);
      };

      ws.onclose = () => {
        console.log('[WS] Disconnected');
        setConnected(false);
        
        if (heartbeatTimeoutRef.current) {
          clearTimeout(heartbeatTimeoutRef.current);
        }

        // Auto reconnect
        if (reconnectAttemptRef.current < MAX_RECONNECT_ATTEMPTS) {
          const delay = RECONNECT_DELAYS[reconnectAttemptRef.current] || RECONNECT_DELAYS[RECONNECT_DELAYS.length - 1];
          console.log(`[WS] Reconnecting in ${delay}ms (attempt ${reconnectAttemptRef.current + 1}/${MAX_RECONNECT_ATTEMPTS})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptRef.current++;
            connect();
          }, delay);
        } else {
          console.error('[WS] Max reconnect attempts reached');
        }
      };
    } catch (error) {
      console.error('[WS] Connection error:', error);
    }
  }, [url, setConnected, checkHeartbeat]);

  const disconnect = useCallback(() => {
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnected(false);
  }, [setConnected]);

  useEffect(() => {
    // Handle page visibility
    const handleVisibilityChange = () => {
      if (document.hidden) {
        disconnect();
      } else {
        connect();
      }
    };

    connect();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [connect, disconnect]);

  return {
    ws: wsRef.current,
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
    reconnect: () => {
      disconnect();
      reconnectAttemptRef.current = 0;
      connect();
    },
  };
}

