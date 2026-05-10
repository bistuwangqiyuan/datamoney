import { useEffect, useRef, useCallback, useState } from 'react';
import { useMarketStore } from '@/lib/store/useMarketStore';
import {
  RECONNECT_DELAYS,
  MAX_RECONNECT_ATTEMPTS,
  HEARTBEAT_INTERVAL,
} from '@/lib/utils/constants';

export function useBinanceWebSocket(url: string) {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );
  const heartbeatTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );
  const lastMessageTimeRef = useRef<number>(Date.now());
  const setConnected = useMarketStore((state) => state.setConnected);

  const disconnect = useCallback(() => {
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
      heartbeatTimeoutRef.current = undefined;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = undefined;
    }
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {
        // ignore
      }
      wsRef.current = null;
    }
    setWs(null);
    setConnected(false);
  }, [setConnected]);

  const connect = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const socket = new WebSocket(url);
      wsRef.current = socket;

      const scheduleHeartbeat = () => {
        if (heartbeatTimeoutRef.current) {
          clearTimeout(heartbeatTimeoutRef.current);
        }
        heartbeatTimeoutRef.current = setTimeout(() => {
          const sinceLast = Date.now() - lastMessageTimeRef.current;
          if (sinceLast > HEARTBEAT_INTERVAL) {
            try {
              socket.close();
            } catch {
              // ignore
            }
          } else {
            scheduleHeartbeat();
          }
        }, HEARTBEAT_INTERVAL);
      };

      socket.addEventListener('open', () => {
        setConnected(true);
        reconnectAttemptRef.current = 0;
        lastMessageTimeRef.current = Date.now();
        setWs(socket);
        scheduleHeartbeat();
      });

      // Track activity for heartbeat without interfering with consumer listeners.
      socket.addEventListener('message', () => {
        lastMessageTimeRef.current = Date.now();
      });

      socket.addEventListener('error', (event) => {
        console.error('[WS] Error:', event);
      });

      socket.addEventListener('close', () => {
        setConnected(false);
        if (heartbeatTimeoutRef.current) {
          clearTimeout(heartbeatTimeoutRef.current);
          heartbeatTimeoutRef.current = undefined;
        }
        if (wsRef.current === socket) {
          wsRef.current = null;
          setWs(null);
        }

        if (reconnectAttemptRef.current < MAX_RECONNECT_ATTEMPTS) {
          const delay =
            RECONNECT_DELAYS[reconnectAttemptRef.current] ??
            RECONNECT_DELAYS[RECONNECT_DELAYS.length - 1];
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptRef.current += 1;
            connect();
          }, delay);
        }
      });
    } catch (error) {
      console.error('[WS] Connection error:', error);
    }
  }, [url, setConnected]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    connect();

    const handleVisibilityChange = () => {
      if (document.hidden) {
        disconnect();
      } else {
        reconnectAttemptRef.current = 0;
        connect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      disconnect();
    };
  }, [connect, disconnect]);

  const reconnect = useCallback(() => {
    disconnect();
    reconnectAttemptRef.current = 0;
    connect();
  }, [disconnect, connect]);

  return {
    ws,
    isConnected: ws?.readyState === WebSocket.OPEN,
    reconnect,
  };
}
