# StyleSense AI

An AI-powered fashion shopping app: browse/buy a product catalog and get outfit picks from an AI Stylist chat.

## Language

**Conversation**:
One thread of exchanges between a user and the AI Stylist, holding an ordered list of Messages. Owned by exactly one user. Has a title, either auto-generated from its first message or set by the user.
_Avoid_: Chat, chat session, thread

**Conversation title**:
The label shown for a Conversation in the History list. Auto-set once, from the first 50 characters of the Conversation's first message, the first time that message is sent. A user may overwrite it by renaming (max 50 chars, matching the auto-generated length); clearing it to empty resets display to the "New conversation" fallback rather than storing an empty string as a real title.
_Avoid_: Chat name, subject
