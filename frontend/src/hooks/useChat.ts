// src/hooks/useChat.ts
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import type { ChatProductCard } from "../api/chat";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  products?: ChatProductCard[];
}

// Derived from the current page rather than hardcoded, so the same build works
// on localhost and in production with no environment variable.
//
// The protocol swap is not cosmetic: a page served over https may not open a
// plain ws:// socket. Browsers block it as mixed content, and the failure is
// silent enough to be genuinely confusing — the socket just never connects.
const WS_URL = `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${
  window.location.host
}/ws/chat/`;
const MAX_RECONNECT_DELAY_MS = 30000;

export function useChat() {
  const { isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
          return; // don't connect at all while logged out
        }

    let reconnectAttempts = 0;
    let reconnectTimeout: ReturnType<typeof setTimeout>;
    let shouldReconnect = true;

    function connect() {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        reconnectAttempts = 0; // a clean connect resets the backoff clock
      };

      ws.onclose = () => {
        setIsConnected(false);
        if (!shouldReconnect) return;
        const delay = Math.min(1000 * 2 ** reconnectAttempts, MAX_RECONNECT_DELAY_MS);
        reconnectAttempts += 1;
        reconnectTimeout = setTimeout(connect, delay);
      };

      ws.onmessage = (e) => {
        const data = JSON.parse(e.data);
        switch (data.event) {
          case "stream_start":
            setIsStreaming(true);
            setConversationId(data.conversation_id);
            setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
            break;
          case "token":
            setMessages((prev) => {
              const next = [...prev];
              next[next.length - 1] = {
                ...next[next.length - 1],
                content: next[next.length - 1].content + data.content,
              };
              return next;
            });
            break;
          case "products":
            // Arrives just before stream_end, once the backend has resolved the
            // [[product:id]] markers in the finished reply to real catalog rows.
            setMessages((prev) => {
              const next = [...prev];
              next[next.length - 1] = {
                ...next[next.length - 1],
                products: data.products,
              };
              return next;
            });
            break;
          case "stream_end":
            setIsStreaming(false);
            break;
          case "error":
            setIsStreaming(false);
            console.error("Chat error:", data.message);
            break;
        }
      };
    }

    connect();

    return () => {
      shouldReconnect = false;
      clearTimeout(reconnectTimeout);
      wsRef.current?.close();
    };
  }, [isAuthenticated]);

  const sendMessage = useCallback((text: string, conversationId?: string | number) => {
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    wsRef.current?.send(
      JSON.stringify({ type: "chat.message", message: text, conversation_id: conversationId })
    );
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setConversationId(null);
  }, []);

  return { messages, isStreaming, isConnected, sendMessage, clearMessages, conversationId };
}
