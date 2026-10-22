# Scopewise demo

A clickable mockup of the full Scopewise flow and a video recorded from it,
for presentations. It is a standalone page with a **scripted** story: no
backend, no real AI, so nothing can go wrong on stage.

| File | What |
| --- | --- |
| `scopewise-demo.mp4` | 1080p video, ~1:40, no sound |
| `scopewise-demo.html` | The clickable demo – open it in any browser |
| `record.mjs` | Re-records the video after you change the demo |

## The story

1. **Agency sends a survey** – Pixel & Co creates a survey for Hartmann Bakery and gets a private link.
2. **Client answers** – Anna answers 9 adaptive questions on her phone. The
   "Behind the scenes" panel shows which briefing topics are covered and why
   each question was asked.
3. **Briefing ready** – the agency opens the structured briefing.

The video adds a title slate before and a closing slate after the story.

## Presenting live

- **▶ Play demo** plays everything automatically (with title and closing slate).
- Or click through yourself. In the answer field, **any key types the
  prepared answer** – no typos on stage. Enter sends it.
- The chapter buttons at the top jump straight to 1, 2 or 3.

## Changing the demo and re-recording the video

All texts (questions, answers, briefing, captions) are in the `<script>`
block of `scopewise-demo.html` (`TURNS`, `BRIEFING`, `CAPTIONS`, `SLATES`).
After editing:

```bash
brew install ffmpeg      # once
cd demo
npm install              # once
npm run record           # writes scopewise-demo.mp4 (takes ~2 minutes)
```

Recording needs Google Chrome installed.
