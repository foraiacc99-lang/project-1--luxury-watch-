# Richard Mille RM 50-03 McLaren F1 — Scroll-Driven Exploded Watch Site

## Source Assets (analyzed)

| File | Type | Notes |
|---|---|---|
| `Use_IMAGE_as_the_assembled_R.mp4` | Video, 1280x720, 24fps, 10s (240 frames), H.264 + AAC audio | **Disassembly animation**: starts as the fully assembled watch (orange rubber strap, carbon TPT case, McLaren RM50-03/01) rotating slightly, then the front sapphire crystal lifts and slides off, the case bezel separates, the skeleton dial/movement separates from the case-back, and finally the strap, crown, pushers and screws fly apart into a full exploded layout. Ends on the fully exploded state. Has a faint background audio track (~ -29dB, likely ambient/whoosh). |
| `TITLE__Luxury_Exploded_Watch_Animation_202606142207.jpeg` | Image (white bg) | Exploded-view hero render — case, dial, movement, crown assembly, strap laid out left→right on white. **Use as the "fully exploded" end state / hero still.** |
| `richard-mille-rm-50-03-mclaren-f1-watch-and-strap_jpg...` | Image (black bg) | Fully **assembled** watch, 3/4 angle, on dark background — orange textile strap, carbon case, "SPLIT SECOND" pusher visible. **Use as the "fully assembled" start state.** |
| `ChatGPT_Image_Jun_14...png` | Image (white bg) | Same exploded-view composition as the title jpeg (AI-recreated version). Backup/alternate exploded asset, can be used for parallax layers if needed. |

**Important production note:** the mp4 plays *assembled → exploded*. The site needs *exploded (top) → assembled (bottom, looping)*. Plan to either (a) reverse the video programmatically for the intro reveal, or (b) scrub the video timeline backwards via `currentTime` bound to scroll progress, or (c) export the exploded image as the starting hero frame and use the video (forward or reversed) only for the in-between scrub frames, looping back to assembled at the end of the page.

---

## Concept

A single-page, scroll-driven cinematic experience for a **demo/local-host Richard Mille microsite**, dedicated to the **RM 50-03 McLaren F1 Tourbillon**. The watch "explodes" into its component parts as the user scrolls down, revealing brand/story content alongside each stage, then **reassembles** at the end so the page loops naturally.

---

## Page Structure (Scroll Sequence)

### Section 0 — Hero / Load State
- Full-viewport hero showing the watch in its **exploded** state (use exploded image or final frame of the scrub video) centered or right-aligned on screen.
- Headline: "RM 50-03 — McLaren F1" + tagline (e.g. "Engineering at 300g").
- Scroll-down indicator/cue.

### Section 1 — "Watch moves to the left" (Assembly begins)
- Triggered on first scroll.
- The watch (scrubbed via the video, reversed) animates from fully exploded → partially assembled, while **translating from center/right toward the left side of the viewport**.
- This frees up the right-hand column for copy.
- Right column: empty or fading in subtle background texture (sets up next section).

### Section 2 — First Info Block (Right side)
- Watch continues to sit pinned on the left, continuing its scrub toward more "assembled."
- Right side fades/slides in: **Introduction copy** — e.g. "Crafted from Carbon TPT®, the RM 50-03 fuses Formula 1 engineering with Haute Horlogerie."
- Suggested content: material specs (case material, weight ~40-42g case, skeletonized movement, tourbillon, split-seconds chronograph).

### Section 3 — McLaren x Richard Mille Collaboration (Right side)
- Watch continues scrubbing toward assembled, still pinned left.
- Right side: new info block replaces/transitions from Section 2 — **the partnership story**. e.g. "Since 2017, Richard Mille has been McLaren F1's Official Timing Partner — combining motorsport-grade materials (Carbon TPT, Graph TPT, Quartz TPT) with watchmaking."
- Suggested content: McLaren Racing partnership year, shared engineering philosophy (lightweight, high-performance materials), driver tie-ins.

### Section 4 — Final Info Block (Right side)
- Watch nearly fully assembled, still pinned left.
- Right side: closing info — e.g. specs summary table (caliber, power reserve, water resistance, limited edition number, price positioning) or a closing brand statement / CTA ("Discover the Collection").

### Section 5 — Reassembly Complete / Loop
- Watch finishes reassembling to the fully assembled state (matching the black-background hero image) and **recenters** in the viewport.
- This final state should visually match/blend back into Section 0's starting composition so scrolling back up — or the video looping — feels seamless ("loop video kind of something").
- Optional: fade to a closing card or simply hold on the assembled watch with a "Back to top" / replay scroll cue.

---

## Animation / Scroll Mechanics

- **Scroll-scrubbed video or canvas frame sequence**: bind scroll position (0→1 progress across the whole page, or per-section) to:
  - `video.currentTime` (simplest — scrub the 10s/240-frame mp4 reversed for exploded→assembled), OR
  - an extracted PNG frame sequence drawn to `<canvas>` for crisper control (recommended for production quality, avoids video seeking jank).
- **Position animation**: separate from the explode/assemble scrub — the watch's on-screen X position (center → left → center) is driven by its own scroll-mapped transform (translateX), likely using CSS transforms or a small JS scroll-progress utility (no heavy libraries needed for a local demo; IntersectionObserver + scroll listener, or a lightweight lib like GSAP ScrollTrigger if allowed).
- **Pinning**: the watch element should be `position: sticky` or fixed within its scroll container while the right-column text blocks scroll past/transition.
- **Text transitions**: cross-fade or slide-up/slide-out between Sections 2, 3, 4 info blocks as scroll progress crosses thresholds.
- **Looping**: at the end of Section 5, either loop scroll back to top (reset) or loop the video/frame sequence back to start — reinforcing the "exploded ↔ assembled" cycle.

---

## Visual/Brand Direction

- Background: clean white or near-black (both source images use these — pick one consistent background, likely **dark/black** for a premium horology feel, matching the assembled-watch photo).
- Color accents: **orange** (from the McLaren papaya strap) as primary accent against black/carbon-fiber dark grey.
- Typography: condensed/technical sans-serif (e.g. similar to Richard Mille's own branding — bold, all-caps headers).
- Layout: minimalist, generous whitespace, large type, asset-led (let the watch imagery dominate).

---

## Tech Stack Suggestion (for local-host demo)

- Plain HTML/CSS/JS single page, OR a small React/Vite setup.
- Scroll-linked animation: native `IntersectionObserver` + scroll progress calc, or GSAP + ScrollTrigger for smoother control.
- Assets folder: store the mp4, both watch images, and an extracted PNG frame sequence (from the mp4) for canvas scrubbing if going that route.
- No backend needed — fully static.

---

## Open Items / Decisions Needed

1. Confirm reversed scrub direction (exploded→assembled on scroll down) vs. re-shooting/re-rendering the animation in correct order.
2. Decide canvas frame-sequence vs. direct video scrubbing (frame sequence = smoother but more setup).
3. Finalize copy for Sections 2–4 (specs, McLaren partnership facts, CTA).
4. Confirm color theme (dark vs. light background).
