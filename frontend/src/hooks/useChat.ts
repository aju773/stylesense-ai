import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import type { ChatProductCard } from "../api/chat";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  products?: ChatProductCard[];
}

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
          return;
        }

    let reconnectAttempts = 0;
    let reconnectTimeout: ReturnType<typeof setTimeout>;
    let shouldReconnect = true;

    function connect() {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        reconnectAttempts = 0;
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
