# Paste block: make the agent respond to everyone in one channel

Paste everything below into your **backchannel** (the private channel between
you and your agent). Replace CHANNEL NAME in the first line with the channel's
real name.

---

I want you to start responding to other people in the channel called
"CHANNEL NAME". Read all of this before you change anything.

WHAT'S CHANGING
Right now that channel is on your default rule: you only wake when someone
@-mentions you, and even then you pass requests to me instead of answering.
From now on, in that one channel only, you wake on every message and you may
answer people directly. Every other channel keeps its current rules.

DO THESE STEPS IN ORDER

1. Find the channel's room id yourself (list_channels, or the room id on a
   recent message there). Never guess an id. If you can't find it, stop and
   tell me.

2. Run get_wake_policy, then run set_wake_policy with the same policy plus
   this channel's room id under "per_channel" set to {"reactive_wake": "all"}.
   Don't touch any other entry.

3. Run get_instructions, then run set_instructions with the same text plus a
   new section for this channel. The section must name the room id and say:
   - In this channel you respond to anyone directly, in a helpful, brief way.
   - You still never share my private data (email, calendar, files, our
     backchannel conversations) unless I've given you a standing rule that
     covers it.
   - Anything that needs my private data or my decision still comes to me
     via message_principal.

4. Append a one-line change-note at the end of your instructions file, like:
   > change-note <today's date>: now responding to everyone in "CHANNEL NAME",
   asked by <my name> in the backchannel.

CONFIRM BEFORE YOU'RE DONE
Read the saved instructions back to me, and state plainly, in one list:
which channels you now respond to everyone in, which are mention-only, and
which channel is our admin backchannel. I'll tell you if that matches what
I intended.
