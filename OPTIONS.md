# Lumagen Card — options

Every option is in the visual editor; this page is for YAML users and for looking up what a setting
does. Only settings that differ from the default are saved, so a new card is just:

```yaml
type: custom:lumagen-card
```

Editor panels: **Card** (device, title, power & standby) · **Sections** (order, show / hide, and the
pencil on each row for its name, settings and merge) · **Screen & visualizer** · **Buttons** ·
**Icons** · **Appearance**.

---

## Card

| Key | Default | Description |
|---|---|---|
| `device` | first Lumagen | Device ID, if you have more than one Lumagen. |
| `title` | `Lumagen` | Header title. |
| `collapsible` | `false` | Tap the header to collapse the card to just the header while the Lumagen is on. |
| `start_collapsed` | `false` | With `collapsible`, start collapsed. |
| `show_dot` | `true` | Show the link dot (green: link OK, red: link down). |
| `dot_position` | `title` | `title` (right of the title), `right` (far right) or `icon` (replaces the header icon; it is then the power button). |
| `shrink_when_narrow` | `true` | Scale the whole card down on narrow screens (below 420 px: text, buttons, remote, icons, visualizer), so nothing overflows on a phone or a narrow grid column. Editor: Card → Size. |
| `stack_when_narrow` | `auto` | Put the status boxes one above the other: `auto` only when the status area is narrower than 260 px (a phone in portrait stays side by side; a small grid column stacks), `always`, or `never`. Editor: Sections → pencil on **The signal chain** → Options. |

## Power & standby

| Key | Default | Description |
|---|---|---|
| `power_hold_on` | `false` | Require a press-and-hold to turn **on** too. Standby always needs a hold (or a double tap). |
| `when_off` | `collapse` | In standby / off: `hide` (hide the whole card), `collapse` (header only, so you can still power on) or `expanded` (keep every section). The editor always shows the card expanded. The old `show_when_off: false` still works and means `hide`. |
| `standby_text` | `below` | The standby message: `below` the title, `inline` with it, or `hidden`. |
| `standby_message` | stock text | Your own standby message. Empty = "Standby · tap the icon to power on". |
| `standby_button` | `false` | In standby, show a power button on the right instead of the "Standby" text. |

## Screen & visualizer

| Key | Default | Description |
|---|---|---|
| `display_name` | `Display` | Heading of the Display box, e.g. your projector. |
| `display_aspect` | `1.78` | Your screen's shape, e.g. `2.40` for a scope screen or `2.00`. |
| `nls_vertical` | `5` | NLS vertical stretch in percent (0–25), as set in your Lumagen's NLS menu. With NLS on, the visualizer stretches the picture this much vertically (cropping the top and bottom) and the rest horizontally, never more vertically than the widening needs. `0` = a purely horizontal stretch. |
| `viz_after_only` | `false` | Show only the screen (the result) and its caption. |
| `scene_image` | built-in landscape | Picture for the visualizer, e.g. `/local/beach.jpg`. |

## Sections

| Key | Default | Description |
|---|---|---|
| `show_chain` · `show_visualizer` · `show_hdr` · `show_aspects` · `show_remote` · `show_source` · `show_picture` · `show_admin` | `true` | Turn a part off. The HDR panel shows only for HDR sources anyway. |
| `show_inputs` · `show_memory` | `true` | Hide only the Inputs or the Memory row of the Source section. |
| `section_order` | default order | Order of the parts: `chain`, `visualizer`, `hdr`, `aspects`, `remote`, `source`, `picture`, `admin`. Missing ones follow in the default order. Editor: Sections → ↑ / ↓. |
| `section_names` | | Your own name per section, e.g. `{ remote: Menu keys }`. Editor: pencil → Name. |
| `section_merge` | | Show a section's settings inside another one, e.g. `{ picture: source }`. The section disappears and its visible settings appear at the end of the target, under its name. Not into a hidden section, no chains, and `hdr` can't merge. Editor: pencil → Merge. |
| `hidden_items` | | Single settings to hide, as `section.setting` (list below). Editor: pencil → Settings, one eye per setting. |

### `hidden_items` ids

| Section | Ids |
|---|---|
| `chain` | `source` (Source box), `display` (Display box), `proc` (Scaled / Tone map on the arrow), `lumagen` (the memory / CMS / Style chips), `tags` (all tags) |
| `chain` — single tags | `tag_link` (LINK DOWN), `tag_hdr`, `tag_game`, `tag_nls`, `tag_auto` (AUTO AR), `tag_3d`, `tag_nosource`, `tag_test` (TEST PATTERN) |
| `visualizer` | `before` (source frame), `after` (screen) |
| `aspects` | `chips`, `nls`, `reset` |
| `remote` | `pad`, `hint` |
| `picture` | `cms`, `style` |
| `admin` | `hotplug`, `restart`, `reload`, `osd_test`, `osd_clear`, `alt`, `hint`, `link`, `missing` |

The Source section's rows have their own keys (`show_inputs`, `show_memory`).

## Buttons

| Key | Description |
|---|---|
| `hide_aspects` | Aspect buttons to hide, as shown (e.g. `['2.35']`), plus `nls` and `reset`. |
| `hide_inputs` | Input numbers to hide, e.g. `[3, 7]`. |
| `hide_memory` | Memory letters to hide, e.g. `[A, C]`. |

The editor's **Buttons** panel lists your Lumagen's own options with an eye on each.

## Icons & colors

| Key | Default | Description |
|---|---|---|
| `icons:` | | Per part: `header`, `aspect`, `remote`, `source`, `picture`, `admin`. Any MDI name; `mdi:` is optional. |
| `accent_color` | theme primary | The card's context color (also the aspect lines in the boxes). |
| `hdr_color` | amber | Tint while HDR plays. |
| `game_color` | green | Tint in game mode. |

## Appearance (`styles:`)

Sizes are in px; colors take any CSS color or theme variable (e.g. `var(--accent-color)`).

- **Sizes:** `card_radius` `card_padding` `standby_indent` `header_icon_size` `title_size` `summary_size` `section_icon_size` `section_title_size` `subtitle_size` `text_size` `secondary_size` `chip_size` `icon_size` `viz_height` `caption_size` `viz_border_width`
- **Colors:** `card_background` `card_border_color` `box_background` `divider_color` `header_icon_color` `title_color` `summary_color` `section_icon_color` `section_title_color` `subtitle_color` `text_color` `secondary_color` `chip_color` `chip_background` `chip_border_color` `icon_color` `caption_color` `viz_border_color`
- `card_background`, `card_border_color`, `box_background`, `divider_color`, `chip_background`, `chip_border_color` and `viz_border_color` also accept `transparent`.

---

## How the signal chain is read

- **Rows line up:** resolution & rate, then dynamic range, then aspect, on both sides.
- **Output dynamic range:** the Lumagen reports none of its own, so it is read from the output
  colorspace: BT.2100 is an HDR output, BT.2020 / 709 / 601 are SDR.
- **Tone map** shows when an HDR source goes out as SDR; **Scaled** when the resolution changes.
- The Lumagen reports no source colorspace and no output nits, so those appear on one side only.
- **Zoom** isn't shown in the visualizer; it can't be read over RS-232.

## Entities

The card finds the integration's entities by their **translation keys**, so renamed entity IDs keep
working. Some entities are **disabled by default**: CMS, Style, Reset Auto Aspect, Game Mode, HDR Max
Mastering Luminance and HDR MaxCLL. Until you enable them their controls are simply absent, and the
Admin section lists them. Enable them in **Settings → Devices & services → Lumagen → device → Entities**.

## Example

A 2.00 screen named after the projector, a bigger visualizer, custom icons, no NLS tag:

```yaml
type: custom:lumagen-card
display_name: JVC NZ8
display_aspect: 2.0
hidden_items: [chain.tag_nls]
icons:
  header: movie-open
  remote: remote-tv
styles:
  viz_height: 110
  title_color: var(--accent-color)
```
