# Lumagen Card

A Home Assistant Dashboard **custom card** for the **Lumagen Radiance Pro**: the signal chain from source to screen, an aspect visualizer drawn from the live ratios, HDR details, one-tap controls, a menu remote and an admin drawer — all in one card with a visual editor.

Current build: **v2026.10.15.5** · full history in [CHANGELOG.md](CHANGELOG.md)

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=Ltek&repository=lumagen-card&category=plugin)

> Requires the **Lumagen integration**: [Ltek/lumagen](https://github.com/Ltek/lumagen) for every feature, or the original [jaysoffian/ha-lumagen](https://github.com/jaysoffian/ha-lumagen) by Jay Soffian, on which it is built (link health, hotplug, OSD test, CMS/Style, game mode and HDR metadata then hide themselves).

---

## What it shows

By default status sits on top (the order can be changed — see `section_order`). **Every control is in a collapsed section**, so nothing changes by accident; each collapsed header shows the current value.

```
 ▣  Lumagen ●                                Apple TV · HDR · 2.40
 ┌ SOURCE ─────┐   ┌ LUMAGEN ───┐   ┌ JVC ───────┐
 │ Apple TV    │ › │ MEM D      │ › │ 2160p24    │
 │ 2160p24     │   │ HDR        │   │ BT.2020    │
 │ HDR 1000 nt │   │ Scope      │   │ 2.40       │
 └─────────────┘   └────────────┘   └────────────┘
 [HDR] [AUTO AR]
      [source picture]   →   [your screen]
   Content 2.40 in 1.78    Content 2.40 · Output 2.40
          frame                on 2.40 screen
 Mastered 1000 nits · MaxCLL 850  ████████████░░░
 ▭ Aspect   2.40 · auto                           ›
 ▦ Remote                                         ›
 ⇥ Source   Apple TV · MEM D                      ›
 ◐ Picture  HDR · Scope                           ›
 ⚙ Admin & link                                   ›
```

- **Header** — the icon is the power button: tap to turn the Lumagen on, **hold** for standby (a stray tap can't stop your movie). The dot is the link: green = the Lumagen answers, red = link down; the summary reads *Offline* in red.
- **Standby** — the card shrinks to its header instead of disappearing, so you can power on from it. Choose where the "Standby · tap the icon to power on" message goes (below, inline, hidden), or show a power button on the right. Optionally require a hold to turn on too, or hide the card while off (it always shows while you edit the Dashboard).
- **Collapse** — optionally tap the header to collapse the card to just the header while the Lumagen is on, and start collapsed.
- **Signal chain** — source → Lumagen → display; a 24 → 60 or HDR → SDR mismatch is obvious at a glance.
- **Tags** appear only when active: HDR, GAME, NLS, AUTO AR, 3D, NO SOURCE, TEST PATTERN, LINK DOWN.
- **Aspect visualizer with a real picture** — left: the incoming frame with the picture where it really is (letterbox bars and all), and a dashed outline when the Lumagen is set to a different aspect than the content. Right: *your* screen, with the region the Lumagen is set to **stretched into its output area exactly as the Lumagen does** — so a wrong setting shows the real crop or the bars you'd see. A caption is centered under each screen. Uses a built-in landscape, or your own picture. Option: show only the screen.
- **HDR panel** (HDR sources) — mastering peak and minimum, and a MaxCLL bar.
- **Aspect** — aspect chips (from the integration's *Aspect ratio menu* option), NLS and Reset auto aspect.
- **Remote** — Menu / Exit / Clear / Help / OK and arrows; **hold an arrow to repeat it 5×**.
- **Source** — input chips (your Lumagen labels) and memory A–D.
- **Picture** — CMS and Style chips (your labels).
- **Admin & link** (**hold to run**) — Hotplug, Restart outputs, Reload config, OSD test, Clear OSD, ALT; link health, and a list of integration entities that are still disabled.
- **Context tint** — accent normally, HDR color while HDR plays, game color in game mode.

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

Everything is in the visual editor (Device · Card & sections · Screen & visualizer · Buttons · Icons · Appearance). YAML keys are only written when they differ from the default.

| Key | Default | Description |
|---|---|---|
| `device` | first Lumagen | Device ID, if you have more than one Lumagen. |
| `title` | `Lumagen` | Header title. |
| `show_when_off` | `true` | `true`: show the card (header only) while off. `false`: hide the card while off. |
| `standby_text` | `below` | Standby message "Standby · tap the icon to power on": `below` the title, `inline` with it, or `hidden`. |
| `standby_message` | stock text | Your own standby message; empty = "Standby · tap the icon to power on". |
| `show_dot` | `true` | Show the link dot. |
| `dot_position` | `title` | `title` (right of the title), `right` (far right), or `icon` (replaces the header icon; it is then the power button). |
| `hide_aspects` · `hide_inputs` · `hide_memory` | | Buttons to hide — aspect ratios as shown (plus `nls`, `reset`), input numbers (e.g. `[3, 7]`), memory letters (e.g. `[A, C]`). The editor's **Buttons** panel lists your Lumagen's options. |
| `standby_button` | `false` | In standby, replace the right-hand "Standby" with a power button that turns the Lumagen on. |
| `power_hold_on` | `false` | Require a press-and-hold to turn **on** too (standby always needs a hold). |
| `collapsible` | `false` | Tap the header to collapse the card to just the header while the Lumagen is on. |
| `start_collapsed` | `false` | With `collapsible`, start collapsed. |
| `display_name` | `Display` | Heading of the third signal-chain box (e.g. your projector). |
| `display_aspect` | `1.78` | Your screen shape (e.g. `2.40` for a scope screen). |
| `viz_after_only` | `false` | Show only the screen (result) and its caption. |
| `scene_image` | built-in landscape | Picture for the visualizer, e.g. `/local/beach.jpg`. |
| `section_order` | default order | Order of the card's parts: any of `chain`, `visualizer`, `hdr`, `aspects`, `remote`, `source`, `picture`, `admin`. Missing ones are added at the end in default order. The editor's *Sections* list sets this with ↑/↓. |
| `show_chain` · `show_visualizer` · `show_hdr` · `show_aspects` · `show_remote` · `show_inputs` · `show_memory` · `show_picture` · `show_admin` | `true` | Turn parts off. |
| `accent_color` · `hdr_color` · `game_color` | theme primary · amber · green | Context colors. |
| `icons:` | | `header`, `aspect`, `remote`, `source`, `picture`, `admin` — any MDI name; `mdi:` is optional. |
| `styles:` | | Sizes (px) and colors (any CSS color or theme variable) — see below. |

**`styles:` keys** — sizes: `card_radius` `card_padding` `standby_indent` `header_icon_size` `title_size` `summary_size` `section_icon_size` `section_title_size` `subtitle_size` `text_size` `secondary_size` `chip_size` `icon_size` `viz_height` `caption_size`; colors: `card_background` `card_border_color` `box_background` `divider_color` `header_icon_color` `title_color` `summary_color` `section_icon_color` `section_title_color` `subtitle_color` `text_color` `secondary_color` `chip_color` `chip_background` `chip_border_color` `icon_color` `caption_color`.

Backgrounds and borders (`card_background`, `card_border_color`, `box_background`, `divider_color`, `chip_background`, `chip_border_color`) also accept `transparent` — the editor offers it as a choice.

Example — scope screen, bigger visualizer, custom icons:

```yaml
type: custom:lumagen-card
display_name: JVC NZ8
display_aspect: 2.4
icons:
  header: movie-open
  remote: remote-tv
styles:
  viz_height: 110
  title_color: var(--accent-color)
  card_background: "#0d1b2a"
```

## Credits

- **[Jay Soffian](https://github.com/jaysoffian)** — the original [ha-lumagen](https://github.com/jaysoffian/ha-lumagen) integration this card is designed around.
- [Lumagen](https://www.lumagen.com) for the published [RS-232 command interface](https://www.lumagen.com/s/Tip0011_RS232CommandInterface_111023.pdf).

MIT licensed — see [LICENSE](LICENSE).
