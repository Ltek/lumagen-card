# Changelog

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
