# Lumagen Card

A Home Assistant Dashboard card for the **Lumagen Radiance Pro**. See what comes in, what the Lumagen
does with it and what reaches your screen, watch a live picture of how your aspect settings crop and
scale it, and reach every everyday control from one card, set up in a visual editor.

Current build: **v2026.10.29.20** · full history in [CHANGELOG.md](CHANGELOG.md) · every YAML option in [OPTIONS.md](OPTIONS.md)

```
 ▣  Lumagen ●                                Apple TV · HDR · 2.40
 ┌ APPLE TV ─────────────┐            ┌ JVC ──────────────────┐
 │ 2160p24               │  Tone map  │ 2160p24               │
 │ HDR · 1000 nits       │  ───────►  │ SDR · BT.2020         │
 │ 2.40                  │            │ 2.40                  │
 └───────────────────────┘            └───────────────────────┘
 (MEM D) (HDR) (Scope) [HDR] [AUTO AR]
      [source picture]   →   [your screen]
 Mastered 1000 nits · MaxCLL 850  ████████████░░░
 ▭ Aspect   2.40 · auto                           ›
 ▦ Remote                                         ›
 ⇥ Source   Apple TV · MEM D                      ›
```

---

## Installation

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=Ltek&repository=lumagen-card&category=plugin)

1. Click the button above. It opens HACS in your Home Assistant with this repository filled in.
2. Add it, then click **Download**. HACS registers the Dashboard resource for you.
3. Hard-refresh the browser (Ctrl/Cmd + Shift + R).
4. On a dashboard: **+ Add card → Lumagen Card**. With one Lumagen there is nothing to set up; tell it
   your screen's shape and name to get the most from the visualizer.

The card is a **custom repository**, so searching HACS won't find it. If the button doesn't work:
HACS → **⋮ → Custom repositories** → `https://github.com/Ltek/lumagen-card`, category **Dashboard**.

**Requires** a Lumagen integration:

- [Ltek/lumagen](https://github.com/Ltek/lumagen) — **recommended**, for every feature.
- or the original [jaysoffian/ha-lumagen](https://github.com/jaysoffian/ha-lumagen) by Jay Soffian, on
  which it is built. Link health, hotplug, OSD test, CMS / Style, game mode and HDR metadata then hide
  themselves.

---

## Features

### See the whole signal chain
- **Source → Display**, row for row: resolution and rate, dynamic range, aspect, so a 24 → 60 or
  HDR → SDR change is obvious at a glance.
- The arrow says what the Lumagen is doing: **Scaled** and **Tone map** (an HDR source sent out as SDR).
- The aspects stand out in your theme color, with **NLS** next to the output aspect when it is on.
- Your **memory, CMS and Style** as chips, next to tags for HDR, game mode, NLS, auto aspect, 3D, no
  source and test pattern. Each tag can be turned off on its own.
- The card **tints** in your HDR color while HDR plays, and your game color in game mode.

### An aspect visualizer with a real picture
- **Left:** the incoming frame, with the picture where it really is, letterbox bars and all.
- **Right:** your screen, with the picture scaled into it **the way the Lumagen does**: letterboxed or
  pillarboxed when the shapes differ, never distorted.
- **NLS** is drawn like the real thing: a horizontal stretch that fills the screen's width, nothing cropped.
- **Wide films** (e.g. 2.40 on a 2.00 screen) are letterboxed, or — if your Lumagen zooms them — enlarged
  to fill the screen with the left and right sides cropped (*Pictures wider than the screen*).
- A wrong aspect setting shows the real crop or bars, with a caption saying what you see.
- Use the built-in landscape or your own picture; or show only the screen.

### HDR details
- For HDR sources: the mastering peak and minimum, and a MaxCLL bar.

### Everyday control without accidents
- The header icon is the power button: **tap to turn on, hold for standby**, so a stray tap can't end
  your movie. Keyboard and screen-reader users tap twice to confirm.
- **Every control sits in a collapsed section**; each collapsed header shows the current value.
- **Aspect** buttons, NLS and Reset auto aspect. **Remote** with menu keys and arrows; hold an arrow to
  repeat it 5×. **Source**: your input labels and memory A–D. **Picture**: CMS and Style by name.
- **Admin & link** (hold to run): hotplug, restart outputs, reload config, OSD test, link health, and
  a list of integration entities you can still enable.
- A link dot shows whether the Lumagen answers; in standby, hide the card, collapse it or keep it open.

### Make it yours
- **Reorder, rename, hide and merge sections**, and hide single settings or buttons you never use.
- Size, weight and color for **each row of the status boxes**, set once for both boxes.
- Your own icons, accent / HDR / game colors, and sizes and colors for every part of the card,
  including the visualizer, from your theme or your own.
- Everything is in the visual editor; YAML is optional. Only settings you change are saved.

### Works with your setup
- Finds the integration's entities by their translation keys, so **renamed entities keep working**.
- Entities the integration leaves disabled simply don't appear: no empty rows, no error tiles.
- **Phone-friendly:** the boxes stay side by side on a phone in portrait, and stack only on a very narrow card. Or choose always / never.

---

## Credits

- **[Jay Soffian](https://github.com/jaysoffian)** — the original [ha-lumagen](https://github.com/jaysoffian/ha-lumagen)
  integration this card is designed around.
- [Lumagen](https://www.lumagen.com) for the published [RS-232 command interface](https://www.lumagen.com/s/Tip0011_RS232CommandInterface_111023.pdf).
- Same design as the [JVC Projector Card](https://github.com/Ltek/jvc-projector-card) and the
  [StormAudio Card](https://github.com/Ltek/stormaudio-card).

MIT licensed — see [LICENSE](LICENSE).
