import asyncio

from django.core.management.base import BaseCommand

from apps.chat.services.chat_service import ChatService
from apps.users.models import User


class Command(BaseCommand):
    help = "Test AI streaming end-to-end"

    def handle(self, *args, **options):
        asyncio.run(self._test())

    async def _test(self):
        # Grab any existing user (or create one)
        user = await User.objects.afirst()
        if not user:
            self.stderr.write("No users in DB. Create one first.")
            return

        service = ChatService()
        self.stdout.write("Streaming response:\n")
        self.stdout.write("-" * 40 + "\n")

        async for event in service.send_message_stream(
            user=user,
            conversation_id=None,
            message_text="Suggest a casual outfit for a weekend brunch",
        ):
            if event["event"] == "token":
                self.stdout.write(event["content"])
                self.stdout.flush()
            elif event["event"] == "stream_start":
                self.stdout.write(f"[stream_start conversation_id={event['conversation_id']}]\n")
            elif event["event"] == "stream_end":
                    self.stdout.write(f"\n[stream_end message_id={event['message_id']}]\n")

        self.stdout.write("\n" + "-" * 40)
        self.stdout.write("\nDone! Check DB for saved conversation.")
