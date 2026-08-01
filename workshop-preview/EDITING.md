# Editing this guide yourself

These pages are yours to edit, no need to go through anyone. Here's how.

## The one rule

Change the words, not the tags. In the HTML you'll see text wrapped in angle
brackets like `<p>` and `</p>`. Edit what's between a `>` and the next `<`.
Don't change anything inside the `< >` themselves.

Lines marked `✏️` sit right above text you can rewrite. A line marked `⚠️` is a
command the agent runs. You can reword it, but keep the step numbers and the
layout.

## Editing a page

Two ways. Pick whichever feels easier.

**Quick edit (one page):**
1. Open the file on github.com, e.g. `workshop-preview/1-stand-it-up.html`.
2. Click the pencil icon at the top right of the file.
3. Find a `✏️` line and change the text below it.
4. Scroll down and click **Commit changes**.

**Editing several pages at once:**
1. On the repo, press the `.` key (or change `github.com` to `github.dev` in
   the address bar). This opens a full editor in your browser.
2. Open files from the list on the left and edit them the same way.
3. Commit from the **Source Control** panel (the branch icon on the left):
   type a short message, click the check to commit, then Sync.

## Adding a screenshot

1. Open the `workshop-preview/img/` folder on github.com.
2. Click **Add file → Upload files** and drag your PNG in.
3. Name it exactly as `workshop-preview/SHOTLIST.md` says. The page shows a
   placeholder box until an image with the matching name exists.
4. Commit.

## Seeing your change

Give it about a minute, then refresh:
`https://maczumby.github.io/hermes-setup/workshop-preview/`

It rebuilds automatically after each commit.

## A couple of reassurances

- This is the **preview**. The live guide that people have links to is a
  separate copy, and it doesn't change when you edit here.
- If a page ever looks broken, nothing public broke. Undo your last commit, or
  send it to me and I'll fix it.
- When you're happy with the whole thing, tell me and I'll copy the preview
  over to the live guide. You can do that yourself too, once you've done a few
  edits and it feels routine.
