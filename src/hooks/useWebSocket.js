// src/hooks/useWebSocket.js
import { useEffect, useRef, useCallback } from 'react';

const WS_URL = (process.env.REACT_APP_API_URL || 'http://localhost:3001/api')
  .replace(/^http/, 'ws')
  .replace(/\/api$/, '/ws');

export function useWebSocket(token, handlers = {}) {
  const ws = useRef(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const connect = useCallback(() => {
    if (!token) return;
    if (ws.current?.readyState === WebSocket.OPEN) return;

    ws.current = new WebSocket(`${WS_URL}?token=${token}`);

    ws.current.onopen = () => {
      ws.current.send(JSON.stringify({ type: 'SUBSCRIBE_NOTIFICATIONS' }));
    };

    ws.current.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        const handler = handlersRef.current[msg.type];
        if (handler) handler(msg);
        if (handlersRef.current['*']) handlersRef.current['*'](msg);
      } catch {}
    };

    ws.current.onclose = () => {
      setTimeout(connect, 3000);
    };

    ws.current.onerror = () => ws.current?.close();
  }, [token]);

  useEffect(() => {
    connect();
    return () => { ws.current?.close(); ws.current = null; };
  }, [connect]);
}
