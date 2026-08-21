import asyncio
import time

from channels.generic.websocket import AsyncJsonWebsocketConsumer

from apps.chat.services.chat_service import ChatService

RATE_LIMIT_MAX = 5
RATE_LIMIT_WINDOW_SECONDS = 60


class ChatConsumer(AsyncJsonWebsocketConsumer):
    """WebSocket consumer for chat — streams AI responses token-by-token."""

    async def connect(self):
        user = self.scope.get("user")
        if user is None or user.is_anonymous:
            await self.close()
            return
        self.chat_service = ChatService()
        self.is_streaming = False
        self.message_times: list[float] = []
        self.send_lock = asyncio.Lock()
        self.stream_task = None
        await self.accept()

    async def receive_json(self, content):
        if self.is_streaming:
            await self._send_json_safe({"event": "error", "message": "A response is already streaming."})
            return

        now = time.monotonic()
        self.message_times = [t for t in self.message_times if now - t < RATE_LIMIT_WINDOW_SECONDS]
        if len(self.message_times) >= RATE_LIMIT_MAX:
            await self._send_json_safe({"event": "error", "message": "Rate limit exceeded. Try again shortly."})
            return

        message_text = content.get("message", "").strip()
        if not message_text:
            await self._send_json_safe({"event": "error", "message": "message is required."})
            return

        self.message_times.append(now)
        conversation_id = content.get("conversation_id")

        self.is_streaming = True
        self.stream_task = asyncio.create_task(self._stream_response(conversation_id, message_text))

    async def _stream_response(self, conversation_id, message_text):
        try:
            async for event in self.chat_service.send_message_stream(
                user=self.scope["user"],
                conversation_id=conversation_id,
                message_text=message_text,
            ):
                await self._send_json_safe(event)
        except Exception as e:
            await self._send_json_safe({"event": "error", "message": str(e)})
        finally:
            self.is_streaming = False

    async def _send_json_safe(self, content):
        async with self.send_lock:
            await self.send_json(content)

    async def disconnect(self, close_code):
        if self.stream_task is not None:
            self.stream_task.cancel()
