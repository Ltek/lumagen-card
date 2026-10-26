# Changelog

## v2026.10.26.18

- **The card shrinks on small screens.** Below 420 px wide, every size scales down step by step: text, chips and buttons, the remote keys, icons, the visualizer, and row labels (92 % → 85 % → 78 % → 75 % at 240 px). Before, only the text that already wrapped got smaller; buttons and the remote kept their desktop size and pushed the layout around.
- Under 300 px the Admin buttons go to two per row and row labels (Input, Memory, CMS…) sit above their chips.
- **Admin buttons no longer overlap:** a long label like *Restart outputs* wraps inside its button instead of running into the next one.
- **Fixed: chip and remote-key text ignored the *Chips & buttons → Text size* setting** — a button style reset the font size to the card's. Chips now use 13 px (or your setting), which is a little smaller than before.
- New `shrink_when_narrow` (Card → Size, on by default) turns the shrinking off.

## v2026.10.23.17

- **The status boxes stay side by side on a phone.** They stacked whenever the status area was under 360 px, which is every phone in portrait. Now they stack only under 260 px (e.g. a small grid column).
- **New `stack_when_narrow`** (Sections → pencil on the signal chain → Options): *Only on a very narrow card* (default), *Always* or *Never*.
- The editor label for the arrow's settings eye no longer mentions the aspect (it moved into the boxes in v2026.10.23.15).

## v2026.10.23.16

- **Source and Display rows now carry the same information.** Display's second row starts with the output's dynamic range, like Source: `SDR · BT.2020`, `HDR · BT.2100` (it showed only the colorspace, so *SDR* on one side faced *BT.2020* on the other). The Lumagen reports no output dynamic range, so it is read from the output colorspace (BT.2100 = HDR, the others SDR) — the same rule as the *Tone map* label.

## v2026.10.23.15

- **The aspects moved off the arrow into the boxes**, each on its own line in the theme color: the source aspect in Source, the output aspect (with *· NLS*) in Display. They are no longer joined with SDR / BT.2020. The arrow keeps only what the boxes don't show: *Scaled* and *Tone map*.
- **Memory, CMS and Style are chips** at the start of the tag row (hover for which is which) instead of a separate "Lumagen" strip. `chain.lumagen` hides these chips; the row hides itself when nothing in it is shown.

## v2026.10.23.14

- **Signal chain is two boxes, Source → Display, with what the Lumagen does on the arrow.** Each box has about half the width, so input names and values fit.
  - **Source**: the input in the header (SOURCE · APPLE TV), resolution & rate, then dynamic range, nits and the source aspect.
  - **Arrow**: *Scaled* (resolution changes), *Tone map* (HDR source sent out as SDR — detected from the output colorspace: BT.2100 is an HDR output, BT.2020 / 709 / 601 are SDR), and the aspect change (*1.78 → 2.00 NLS*). Empty for a passthrough.
  - **Display**: output resolution & rate, then colorspace and output aspect.
  - **Lumagen line** under the boxes: memory, CMS and Style, full names (it was the cramped middle box).
- **Each status tag can be hidden on its own** (Sections → pencil on the signal chain → Settings; `hidden_items: [chain.tag_hdr, …]`). All are shown by default.
- Long values wrap to two lines instead of being cut off; empty lines disappear instead of showing "—". On a narrow card the boxes stack, with the arrow pointing down.
- **The visualizer's pictures are centered.** A long caption made its column wider than its picture, which pushed the pictures off center; captions now wrap under their picture.
- `chain.lumagen` in `hidden_items` now hides the Lumagen line.

## v2026.10.22.13

- **NLS crops the top and bottom, like the Lumagen.** With NLS on (e.g. 16:9 on a 2.00 screen), the visualizer now applies a slight vertical stretch — the picture loses a little at the top and bottom — and stretches the rest horizontally, instead of a purely horizontal stretch. The source screen outlines the part that is kept and says how much is cropped (*NLS crops 2.4% top & bottom*); the screen caption reads *top/bottom cropped · NLS stretch*. New `nls_vertical` (default 5 %, Screen → Visualizer): set it to your Lumagen's NLS vertical stretch; `0` is the old horizontal-only stretch. The vertical stretch never goes beyond what the widening needs (e.g. 16:9 → 1.85). Pictures without NLS are unchanged: always scaled uniformly.
- **Holds on a phone or tablet no longer also tap.** Lifting your finger after a hold made the browser send a tap too: holding an arrow sent the 5× repeat plus one more press, and an Admin button or power hold was followed by a "tap again to confirm" prompt. The click that ends a hold is now ignored.
- Long-pressing a button no longer selects its text or opens the iOS callout.

## v2026.10.15.12

- **The visualizer now draws what the Lumagen really outputs.** The picture is scaled uniformly into the output area — letterboxed or pillarboxed when the shapes differ — instead of being stretched to fill it. (Before, a 2.40 film on a 16:9 screen was drawn 35% too tall, and a 16:9 show on a scope screen 35% too wide.)
- **Crop and bars from the source-aspect setting:** set wider than the film, the top and bottom of the picture are cut off; set narrower, the film's own black bars stay in the picture.
- **NLS** fills the width (no vertical stretch — the Lumagen has none); drawn as a plain stretch, since the non-linear curve isn't visible at this size.
- The Lumagen's output area is drawn black; any part of the screen outside it stays unlit.
- The caption under the screen now says what you see: *fills the screen*, *letterboxed*, *pillarboxed*, *top/bottom cropped*, *film bars kept*, *NLS stretch*.
- **Screen border** width and color are adjustable (Appearance → Visualizer), including transparent.
- Not shown: Lumagen zoom — its current value can't be read over RS-232.

## v2026.10.15.11

- **Merged sections follow their own checks.** A merged section's settings now show only when that section would show on its own — e.g. Picture merged elsewhere without its entities no longer leaves an empty heading, and merged controls never appear for a missing entity.
- **Hold-only actions work without a hold.** Standby (and power-on with *hold to turn on*) and the Admin buttons: a tap asks, a second tap within 4 seconds confirms (the button shows a dashed outline meanwhile). Works with the keyboard and assistive tech.
- A press-and-hold is cancelled when your finger slides off the button.
- The editor opens the **Card** panel on start (it tried to open the Device panel, which no longer exists, so everything started collapsed).
- Choosing to merge into an **always-visible** area (the signal chain) shows a warning: the controls are then outside a collapsed section.

## v2026.10.15.10

- The **Device** picker moved into the **Card** panel (it was a whole panel for one setting).
- A section's edit panel (pencil) can now carry options of its own.

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
