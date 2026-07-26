# Paste block: put a channel back to quiet default

Paste everything below into your **backchannel**. Replace CHANNEL NAME with
the channel's real name. Use this to undo "respond to everyone" for a channel.

---

I want the channel called "CHANNEL NAME" back on your quiet default: wake
only when @-mentioned, and pass requests to me instead of answering them.
Read all of this before you change anything.

DO THESE STEPS IN ORDER

1. Find the channel's room id yourself. Never guess. If you can't find it,
   stop and tell me.

2. Run get_wake_policy, then run set_wake_policy with that channel's entry
   removed from "per_channel" so it falls back to the global default. Don't
   touch any other entry.

3. Run get_instructions, then run set_instructions with that channel's
   section removed. Leave everything else exactly as it is.

4. Append a one-line change-note at the end of your instructions file:
   > change-note <today's date>: "CHANNEL NAME" back to mention-only default,
   asked by <my name> in the backchannel.

CONFIRM BEFORE YOU'RE DONE
Read the saved instructions back to me, and state plainly which channels you
now respond to everyone in, which are mention-only, and which channel is our
admin backchannel.
