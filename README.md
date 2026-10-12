# Lumagen Card

A Home Assistant Dashboard **custom card** for the **Lumagen Radiance Pro**: the signal chain from source to screen, an aspect visualizer drawn from the live ratios, HDR details, one-tap controls, a menu remote and an admin drawer — all in one card with a visual editor.

Current build: **v2026.10.12.1** · full history in [CHANGELOG.md](CHANGELOG.md)

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=Ltek&repository=lumagen-card&category=dashboard)

> Requires the **Lumagen integration**: [Ltek/lumagen](https://github.com/Ltek/lumagen) for every feature, or the original [jaysoffian/ha-lumagen](https://github.com/jaysoffian/ha-lumagen) by Jay Soffian, on which it is built (link health, hotplug, OSD test, CMS/Style, game mode and HDR metadata then hide themselves).

---

## What it shows

```
 ⏻  Lumagen ●                                Apple TV · HDR · 2.40
 ┌ SOURCE ─────┐   ┌ LUMAGEN ───┐   ┌ JVC ───────┐
 │ Apple TV    │ › │ MEM D      │ › │ 2160p24    │
 │ 2160p24     │   │ HDR        │   │ BT.2020    │
 │ HDR 1000 nt │   │ Scope      │   │ 2.40       │
 └─────────────┘   └────────────┘   └────────────┘
 [HDR] [AUTO AR]
 ▭ source frame → ▭ your screen      Content 2.40 in 1.78 frame
                                     Output 2.40 on 2.40 screen
 Mastered 1000 nits · MaxCLL 850  ████████████░░░
 Input   [Apple TV] [Kaleidescape] [Xbox] …
 Memory  [A] [B] [C] [D]
 Aspect  [Auto] [1.78] [2.40] …  NLS  Reset
 CMS     [Rec709] [HDR]      Style [Std] [Scope]
 › Menu remote
 › Admin & link
```

- **Header** — tap the power button to turn the Lumagen on; **hold** it to put it in standby (so a stray tap can't turn your movie off). The dot is the link: green = the Lumagen answers, red = link down. The summary turns red and reads *Offline* when the link drops.
- **Standby** — the card collapses to one line instead of disappearing, so you can turn the Lumagen on from it. (Option: hide the card while off. It always shows while you edit the Dashboard.)
- **Signal chain** — source → Lumagen → display. A 24 → 60 or HDR → SDR mismatch is obvious at a glance.
- **Tags** appear only when active: HDR, GAME, NLS, AUTO AR, 3D, NO SOURCE, TEST PATTERN, LINK DOWN.
- **Aspect visualizer** — left: the source frame with the content drawn to scale (letterbox bars and all). Right: *your* screen shape with the image the Lumagen outputs. It animates as Auto Aspect switches.
- **HDR panel** (HDR sources only) — mastering peak and minimum, and a MaxCLL bar relative to the mastering peak.
- **Chips** — one tap for Input, Memory, Aspect ratio (+ NLS and Reset Auto Aspect), CMS and Style. They're built from the integration's own options, so your Lumagen labels appear automatically and the aspect list follows the integration's *Aspect ratio menu* option.
- **Menu remote** (collapsed) — Menu / Exit / Clear / Help / OK and arrows; **hold an arrow to repeat it 5×**.
- **Admin & link** (collapsed, **hold to run**) — Hotplug (all inputs), Restart outputs, Reload config, OSD test (shows your configured volume display at 42), Clear OSD, ALT; the link line shows reconnects, watchdog mode and the last disconnect reason.
- **Context tint** — the accent color normally, the HDR color while HDR plays, the game color in game mode.

Controls dim and stop responding while the Lumagen is in standby or the link is down; last-known values stay visible, dimmed.

## Installation

### HACS

1. Click the badge above, or in HACS → **⋮ → Custom repositories** add `https://github.com/Ltek/lumagen-card`, category **Dashboard**.
2. Install **Lumagen Card** and reload the browser.

### Manual

Copy `lumagen-card.js` to `/config/www/`, then add it under **Settings → Dashboards → ⋮ → Resources** as `/local/lumagen-card.js` (JavaScript module).

## Setup

Add a card → search **Lumagen Card**. With one Lumagen there is nothing to configure. The card finds the integration's entities by their translation keys, so renamed entity IDs keep working.

Minimal YAML:

```yaml
type: custom:lumagen-card
```

### Optional entities

The integration creates some entities **disabled by default**: CMS, Style, Reset Auto Aspect, Game Mode, HDR Max Mastering Luminance, HDR MaxCLL. Until you enable them their controls are simply absent (no error tiles), and the Admin drawer lists them. Enable them in **Settings → Devices & services → Lumagen → device → Entities**.

## Options

All options are in the visual editor; YAML keys are only written when you change them from the default.

| Key | Default | Description |
|---|---|---|
| `device` | first Lumagen | Device ID, if you have more than one Lumagen. |
| `title` | `Lumagen` | Header title. |
| `show_when_off` | `true` | `true`: one-line Standby bar while off. `false`: hide the card while off. |
| `display_name` | `Display` | Heading of the third signal-chain box (e.g. your projector). |
| `display_aspect` | `1.78` | Your screen shape for the visualizer (e.g. `2.40` for a scope screen). |
| `show_chain` · `show_visualizer` · `show_hdr` · `show_inputs` · `show_memory` · `show_aspects` · `show_picture` · `show_remote` · `show_admin` | `true` | Turn sections off. |
| `accent_color` · `hdr_color` · `game_color` | theme primary · amber · green | Any CSS color or theme variable, e.g. `var(--accent-color)`. |

Example — scope screen, no remote:

```yaml
type: custom:lumagen-card
display_name: JVC NZ8
display_aspect: 2.4
show_remote: false
hdr_color: var(--warning-color)
```

## Credits

- **[Jay Soffian](https://github.com/jaysoffian)** — the original [ha-lumagen](https://github.com/jaysoffian/ha-lumagen) integration this card is designed around.
- [Lumagen](https://www.lumagen.com) for the published [RS-232 command interface](https://www.lumagen.com/s/Tip0011_RS232CommandInterface_111023.pdf).

MIT licensed — see [LICENSE](LICENSE).
