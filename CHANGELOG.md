# Changelog

## v2026.10.15.9

- **Sections** is its own top-level panel in the editor (it was at the bottom of *Card & sections*, now just **Card**).
- **The preview no longer refreshes on every change.** A config change now patches the card in place instead of rebuilding it, so the editor preview keeps its icons, open sections and position; a change that leaves the config the same does nothing.

## v2026.10.15.8

- **Edit a section** — a **pencil** on every row in Card & sections → Sections opens that section's settings under the row:
  - **Name**: rename the section (`section_names`); the card and the editor use your name.
  - **Settings**: an eye for each setting in the section (each row, slider, button or status box), so you can hide just the ones you don't use (`hidden_items`). Options the card already had (e.g. menu shortcuts, Low / Mid / High, flows) moved here from the row.
  - **Merge**: show the section's visible settings inside another section instead (`section_merge`). The section disappears from the card and its settings appear at the end of the chosen one, under the section's name. A section other sections merge into stays its own, and nothing merges into a hidden section.
- Status boxes close up when one is hidden (the arrows follow).

## v2026.10.15.7

- **When in standby or off** (Card & sections → Power & standby, YAML `when_off`): **Hide the entire card**, **Collapse to the header** (default, as before) or **Keep expanded** — the last shows every section in standby too. Replaces the "Show the card while off" checkbox; `show_when_off: false` from older configs is read as `hide`.
- **The card editor always shows the card expanded** — in standby, with *Hide* or *Collapse*, and with *Start collapsed* — so every section can be set up. This no longer depends on Home Assistant passing an edit/preview flag to the card.

## v2026.10.15.6

- **Editor preview is never collapsed.** With *Start collapsed* on, the card in the card editor and on a Dashboard in edit mode now always shows expanded. It no longer relies on Home Assistant passing a preview flag to the card, which it doesn't always do.
- **Eye icons instead of checkboxes** for show/hide, per the design guide: every row in *Sections* and every button in the *Buttons* panel. Eye-off rows are dimmed.
- **Source now has its own show/hide** (`show_source`), like every other section. Its Inputs and Memory rows can still be hidden separately.

## v2026.10.15.5

- **Reorder the card's sections.** The editor's *Sections* list (Card & sections panel) now shows every part of the card — signal chain, visualizer, HDR details, Aspect, Remote, Source, Picture, Admin — with ↑/↓ to move it and a Show checkbox (Source has separate Inputs / Memory boxes). Status parts and control sections can be mixed in any order. *Reset to default order* appears once the order has been changed. YAML: `section_order`.

## v2026.10.12.4

- **Link dot:** show or hide it, and choose where it goes — right of the title (default), far right, or in place of the header icon (it is then the power button).
- **Standby message:** your own text (an empty box reverts to the stock "Standby · tap the icon to power on"), and a slider for its indent.
- **Hide individual buttons** in the Aspect (each ratio, NLS, Reset auto), Input and Memory sections — new **Buttons** panel in the editor, listing your Lumagen's actual options.

## v2026.10.12.3

- **Transparent** option for every background and border: card background, card border, box & remote-key background, section dividers (new), chip background and chip border. A transparent card background also drops the card shadow.
- **Power button:** option to require a press-and-hold to turn **on** as well (standby always needs a hold). The standby message says "hold" or "tap" accordingly.
- **Collapse to the header:** option to tap the header to collapse/expand the card while the Lumagen is on, and an option to start collapsed. A chevron shows the state; the power button still works normally. Never collapsed while you edit the Dashboard.
- **Standby message:** below the title (default), inline with the title, or hidden.
- **Standby power button:** option to replace the right-hand word "Standby" with a power button that turns the Lumagen on.

## v2026.10.12.2

- **Every control is now in a collapsible section** (collapsed by default) so nothing changes by accident: Aspect, Remote, Source (inputs + memory), Picture (CMS + Style), Admin & link. Status stays on top. Each collapsed header shows the current value (e.g. "Aspect 2.40 · auto").
- **Order:** status (signal chain, tags, visualizer, HDR), then Aspect and Remote (the most used), then Source, Picture, Admin.
- **Visualizer shows a real picture** cropped and stretched exactly as the Lumagen does: the region the Lumagen is set to is stretched into the output area on your screen, so a wrong aspect setting shows the true crop or bars. Built-in landscape, or your own picture (`scene_image`). A centered caption under each screen ("Content 2.40 · Output 2.40 on 2.40 screen").
- **Option: show only the result screen** (`viz_after_only`).
- **Appearance:** sizes and four-mode (theme / custom / CSS) colors for the card background and border, boxes, header icon / title / summary, section headers, subtitles, values, details text, chips, icons and the visualizer (`styles:`).
- **Custom icons** for the header (power button) and every section — type just the MDI name, `mdi:` is added (`icons:`).
- Uses the detected content aspect when available, so a manual aspect override is shown against the real picture.

## v2026.10.12.1

First release.

- Header: power button (tap to turn on, hold for standby), link dot, live summary (input · dynamic range · aspect), red "Offline" when the link is down.
- Standby: collapses to a one-line bar instead of disappearing (option to hide the card instead; always shown while editing).
- Signal chain: Source → Lumagen → Display with resolution/rate, dynamic range and HDR nits, memory, CMS and style labels, output colorspace and aspect.
- Status tags that appear only when active: HDR, GAME, NLS, AUTO AR, 3D, NO SOURCE, TEST PATTERN, LINK DOWN.
- Aspect visualizer: the source frame with its content drawn to scale, and your screen shape with the Lumagen's output; animates on change.
- HDR panel for HDR sources: mastering peak/min and a MaxCLL bar.
- One-tap chips for Input, Memory, Aspect (plus NLS and Reset), CMS and Style, generated from the integration's own options.
- Collapsed Menu remote (hold an arrow to repeat 5×) and Admin drawer (hold to run: Hotplug, Restart outputs, Reload config, OSD test, Clear OSD, ALT) with link health.
- Context tint: accent normally, HDR color while HDR plays, game color in game mode.
- Entities found by the integration's translation keys (renamed entity IDs keep working); disabled entities hide their controls and are listed in Admin; features needing the LTek integration hide themselves on the original.
- Visual editor: Device, Card, Sections, Screen (shape slider + presets) and Colors (four-mode color controls).
