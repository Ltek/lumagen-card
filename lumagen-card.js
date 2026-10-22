// Lumagen Card — Home Assistant Dashboard card for the Lumagen Radiance Pro
// Version: v2026.10.22.13
//
// Read-only status on top (signal chain, tags, an aspect visualizer that crops and
// stretches a real picture exactly like the Lumagen does, HDR details); every
// control lives in a collapsed section (Aspect, Remote, Source, Picture, Admin) so
// nothing changes by accident. For the `lumagen` integration (github.com/Ltek/lumagen;
// base features also work with jaysoffian/ha-lumagen).
//
// Vanilla JS, single file, light DOM. The card stylesheet is a constant (no config
// values interpolated); per-card values are custom properties set inline on the
// card root. Entities are found by the integration's translation keys, so renamed
// entity IDs keep working; disabled entities simply don't appear.

const BUILD_NUMBER = 'v2026.10.22.13';
const CARD_TAG = 'lumagen-card';
const EDITOR_TAG = 'lumagen-card-editor';

// ---------------------------------------------------------------------------
// Entity map: key → [domain, translation_key, entity_id suffix fallback]
// ---------------------------------------------------------------------------
const ENTITY_KEYS = {
  power: ['switch', 'power', 'power'],
  auto_aspect: ['switch', 'auto_aspect', 'auto_aspect'],
  remote: ['remote', null, ''],
  input: ['select', 'input', 'input'],
  aspect: ['select', 'aspect_ratio', 'aspect_ratio'],
  memory: ['select', 'memory', 'memory'],
  cms: ['select', 'cms', 'cms'],
  style: ['select', 'style', 'style'],
  nls_btn: ['button', 'nls', 'nls'],
  reset_aa: ['button', 'reset_auto_aspect', 'reset_auto_aspect'],
  restart: ['button', 'restart_outputs', 'restart_outputs'],
  reload: ['button', 'reload_config', 'reload_config'],
  connected: ['binary_sensor', 'connected', 'connected'],
  game: ['binary_sensor', 'game_mode', 'game_mode'],
  input_label: ['sensor', 'input_label', 'input_label'],
  logical_input: ['sensor', 'logical_input', 'logical_input'],
  video_status: ['sensor', 'input_video_status', 'input_video_status'],
  src_res: ['sensor', 'source_vertical_resolution', 'source_resolution'],
  src_rate: ['sensor', 'source_vertical_rate', 'source_refresh_rate'],
  src_mode: ['sensor', 'source_mode', 'source_mode'],
  src_dr: ['sensor', 'source_dynamic_range', 'source_dynamic_range'],
  src_3d: ['sensor', 'source_3d_mode', 'source_3d_mode'],
  src_raster: ['sensor', 'source_raster_aspect', 'source_raster_aspect_ratio'],
  src_content: ['sensor', 'source_content_aspect', 'source_content_aspect_ratio'],
  det_content: ['sensor', 'detected_content_aspect', 'detected_content_aspect_ratio'],
  nls: ['sensor', 'nls', 'nls'],
  out_res: ['sensor', 'output_vertical_resolution', 'output_resolution'],
  out_rate: ['sensor', 'output_vertical_rate', 'output_refresh_rate'],
  out_mode: ['sensor', 'output_mode', 'output_mode'],
  out_aspect: ['sensor', 'output_aspect', 'output_aspect_ratio'],
  out_cs: ['sensor', 'output_colorspace', 'output_colorspace'],
  cms_label: ['sensor', 'output_cms_label', 'output_cms_label'],
  style_label: ['sensor', 'output_style_label', 'output_style_label'],
  hdr_max: ['sensor', 'hdr_max_luminance', 'hdr_max_mastering_luminance'],
  hdr_min: ['sensor', 'hdr_min_luminance', 'hdr_min_mastering_luminance'],
  hdr_cll: ['sensor', 'hdr_max_cll', 'hdr_maxcll'],
};

// Optional entities (disabled by default in the integration) → friendly name
const OPTIONAL_ENTITIES = {
  cms: 'CMS select',
  style: 'Style select',
  reset_aa: 'Reset Auto Aspect',
  game: 'Game Mode',
  hdr_max: 'HDR Max Mastering Luminance',
  hdr_cll: 'HDR MaxCLL',
};

/** Lumagen devices known to HA: [{id, name}] (from the entity registry). */
function listDevices(hass) {
  const seen = new Map();
  Object.values((hass && hass.entities) || {}).forEach((e) => {
    if (e.platform !== 'lumagen' || !e.device_id || seen.has(e.device_id)) return;
    const d = (hass.devices || {})[e.device_id] || {};
    seen.set(e.device_id, d.name_by_user || d.name || e.device_id);
  });
  return [...seen].map(([id, name]) => ({ id, name }));
}

/** Map ENTITY_KEYS → entity_id for one device. Missing (or disabled) keys are absent. */
function resolveEntities(hass, deviceId) {
  const out = {};
  if (!hass) return out;
  const all = Object.values(hass.entities || {}).filter((e) => e.platform === 'lumagen');
  const dev = deviceId || (all.find((e) => e.device_id) || {}).device_id;
  const mine = all.filter((e) => !dev || e.device_id === dev);
  const remote = mine.find((e) => e.entity_id.startsWith('remote.'));
  const prefix = remote ? remote.entity_id.slice('remote.'.length) : null;
  Object.entries(ENTITY_KEYS).forEach(([key, [domain, tkey, suffix]]) => {
    let hit = null;
    if (domain === 'remote') hit = remote && remote.entity_id;
    else hit = (mine.find((e) => e.translation_key === tkey && e.entity_id.startsWith(domain + '.')) || {}).entity_id;
    if (!hit && prefix && suffix) {
      // Fallback for HA versions without translation_key in the display registry.
      const guess = `${domain}.${prefix}_${suffix}`;
      if (mine.some((e) => e.entity_id === guess) || (hass.states && hass.states[guess])) hit = guess;
    }
    if (hit) out[key] = hit;
  });
  return out;
}

// ---------------------------------------------------------------------------
// Config — byte-stable: only non-default keys are emitted
// ---------------------------------------------------------------------------
const DEFAULTS = {
  device: '',
  title: 'Lumagen',
  when_off: 'collapse',
  power_hold_on: false,
  standby_text: 'below',
  standby_message: '',
  standby_button: false,
  show_dot: true,
  dot_position: 'title',
  collapsible: false,
  start_collapsed: false,
  display_name: 'Display',
  display_aspect: 1.78,
  nls_vertical: 5, // NLS vertical stretch in percent (the Lumagen's NLS menu); crops top / bottom
  viz_after_only: false,
  scene_image: '',
  show_chain: true,
  show_visualizer: true,
  show_hdr: true,
  show_aspects: true,
  show_remote: true,
  show_source: true,
  show_inputs: true,
  show_memory: true,
  show_picture: true,
  show_admin: true,
  accent_color: '',
  hdr_color: '',
  game_color: '',
};
// Card sections in their default order: [id, editor name, editor icon, show keys].
const SECTIONS = [
  ['chain', 'Signal chain & status tags', 'mdi:transit-connection-variant', ['show_chain']],
  ['visualizer', 'Aspect visualizer', 'mdi:projector-screen-outline', ['show_visualizer']],
  ['hdr', 'HDR details (HDR sources only)', 'mdi:brightness-7', ['show_hdr']],
  ['aspects', 'Aspect', 'icon:aspect', ['show_aspects']],
  ['remote', 'Remote', 'icon:remote', ['show_remote']],
  ['source', 'Source', 'icon:source', ['show_source']],
  ['picture', 'Picture (CMS & Style)', 'icon:picture', ['show_picture']],
  ['admin', 'Admin & link', 'icon:admin', ['show_admin']],
];
const SECTION_IDS = SECTIONS.map((x) => x[0]);

/** Known ids in the given order, duplicates dropped, missing ones appended in default order. */
function normalizeOrder(list) {
  const out = [];
  (Array.isArray(list) ? list : []).forEach((id) => {
    const v = String(id).trim();
    if (SECTION_IDS.includes(v) && !out.includes(v)) out.push(v);
  });
  SECTION_IDS.forEach((id) => { if (!out.includes(id)) out.push(id); });
  return out;
}

// Icons: header (also the power button) and each collapsible section.
const ICON_DEFAULTS = {
  header: 'mdi:overscan',
  aspect: 'mdi:aspect-ratio',
  remote: 'mdi:remote',
  source: 'mdi:video-input-hdmi',
  picture: 'mdi:palette',
  admin: 'mdi:tools',
};
const ICON_LABELS = {
  header: 'Header (power button)', aspect: 'Aspect', remote: 'Remote', source: 'Source', picture: 'Picture', admin: 'Admin & link',
};

/** 'movie' → 'mdi:movie'; 'hass:x' / 'mdi:x' kept; '' → ''. */
function normalizeIcon(v) {
  const s = String(v == null ? '' : v).trim();
  if (!s) return '';
  return s.includes(':') ? s : `mdi:${s}`;
}

// Appearance: [key, group, kind, label, default(px for sizes | label for colors), min, max]
const STYLE_DEFS = [
  ['card_background', 'card', 'color', 'Background', 'Theme card background'],
  ['card_border_color', 'card', 'color', 'Border color', 'Theme border'],
  ['card_radius', 'card', 'size', 'Corner radius', 12, 0, 32],
  ['card_padding', 'card', 'size', 'Padding', 12, 4, 28],
  ['box_background', 'card', 'color', 'Box & key background', 'Subtle grey'],
  ['divider_color', 'card', 'color', 'Section divider color', 'Subtle grey'],
  ['header_icon_size', 'header', 'size', 'Icon size', 22, 14, 44],
  ['header_icon_color', 'header', 'color', 'Icon color (when on)', 'Context color'],
  ['title_size', 'header', 'size', 'Title size', 16, 11, 30],
  ['title_color', 'header', 'color', 'Title color', 'Primary text'],
  ['summary_size', 'header', 'size', 'Summary size', 13, 9, 22],
  ['summary_color', 'header', 'color', 'Summary color', 'Secondary text'],
  ['section_icon_size', 'sections', 'size', 'Icon size', 18, 12, 34],
  ['section_icon_color', 'sections', 'color', 'Icon color', 'Context color'],
  ['section_title_size', 'sections', 'size', 'Title size', 14, 10, 24],
  ['section_title_color', 'sections', 'color', 'Title color', 'Primary text'],
  ['subtitle_size', 'subtitles', 'size', 'Size', 10, 8, 18],
  ['subtitle_color', 'subtitles', 'color', 'Color', 'Secondary text'],
  ['text_size', 'text', 'size', 'Size', 14, 10, 26],
  ['text_color', 'text', 'color', 'Color', 'Primary text'],
  ['secondary_size', 'secondary', 'size', 'Size', 12, 9, 20],
  ['secondary_color', 'secondary', 'color', 'Color', 'Secondary text'],
  ['chip_size', 'chips', 'size', 'Text size', 13, 10, 22],
  ['chip_color', 'chips', 'color', 'Text color', 'Primary text'],
  ['chip_background', 'chips', 'color', 'Background', 'Transparent'],
  ['chip_border_color', 'chips', 'color', 'Border color', 'Subtle grey'],
  ['icon_size', 'icons', 'size', 'Size', 22, 14, 40],
  ['icon_color', 'icons', 'color', 'Color', 'Primary text'],
  ['standby_indent', 'standby', 'size', 'Standby message indent', 46, 0, 160],
  ['viz_height', 'viz', 'size', 'Screen height', 72, 40, 180],
  ['caption_size', 'viz', 'size', 'Caption size', 11, 8, 18],
  ['caption_color', 'viz', 'color', 'Caption color', 'Secondary text'],
  ['viz_border_width', 'viz', 'size', 'Screen border width', 2, 0, 8],
  ['viz_border_color', 'viz', 'color', 'Screen border color', 'Subtle grey'],
];
const STYLE_GROUPS = [
  ['card', 'Card', 'Background, border and the boxes / remote keys.'],
  ['header', 'Header', 'Icon, title and the live summary on the right.'],
  ['sections', 'Section headers', 'The collapsible Aspect / Remote / Source / Picture / Admin rows.'],
  ['subtitles', 'Subtitles', 'Box headings (SOURCE / LUMAGEN / DISPLAY) and row labels (Input, Memory…).'],
  ['text', 'Values', 'Main values in the signal chain boxes.'],
  ['secondary', 'Details text', 'Second lines, HDR details, link and notes.'],
  ['chips', 'Chips & buttons', 'Input / aspect / CMS / admin buttons. Active chips use the context color.'],
  ['icons', 'Icons', 'Remote key icons and the signal-chain arrows.'],
  ['viz', 'Visualizer', 'Screen size, the border around each screen, and the caption under it.'],
];
const STYLE_INDEX = Object.fromEntries(STYLE_DEFS.map((d) => [d[0], d]));
// Backgrounds and borders also offer "Transparent".
const TRANSPARENT_KEYS = new Set(['card_background', 'card_border_color', 'box_background', 'divider_color', 'chip_background', 'chip_border_color', 'viz_border_color']);
const DOT_POSITIONS = [['title', 'Right of the title'], ['right', 'Far right'], ['icon', 'Replace the header icon']];
// Per-section hidden buttons: config key → how an option maps to its stored id.
const HIDE_LISTS = {
  hide_aspects: { entity: 'aspect', id: (o) => o, extra: [['nls', 'NLS'], ['reset', 'Reset auto']] },
  hide_inputs: { entity: 'input', id: (o) => { const m = /\((\d+)\)$/.exec(o); return m ? Number(m[1]) : o; } },
  hide_memory: { entity: 'memory', id: (o) => String(o).replace(/^MEM/, '') },
};
// Ancestors that mean "the Dashboard is being edited / this is the editor preview".
const EDITOR_WRAPPERS = ['hui-card-preview', 'hui-dialog-edit-card', 'hui-card-edit-mode', 'hui-card-options', 'hui-section-edit-mode'];

// ---------------------------------------------------------------------------
// Section editing (editor: pencil on a section row): rename, hide single settings, merge.
// ---------------------------------------------------------------------------
// Per-section settings the user can hide: [id, label, selector, existing show key?]. A setting with
// a show key is the card's own option (its eye toggles that key); the rest use hidden_items.
const SECTION_ITEMS = {
  chain: [['source', 'Source box', '[data-item="box-src"]'], ['lumagen', 'Lumagen box', '[data-item="box-lmg"]'],
    ['display', 'Display box', '[data-item="box-disp"]'], ['tags', 'Status tags', '[data-k="tags"]']],
  visualizer: [['before', 'Source frame (before)', '[data-k="before"], .lmg-viz-arrow'], ['after', 'Screen (after)', '[data-item="viz-after"]']],
  hdr: [],
  aspects: [['chips', 'Aspect buttons', '[data-opts="aspect"]'], ['nls', 'NLS button', '[data-a="nls_btn"]'], ['reset', 'Reset auto button', '[data-a="reset_aa"]']],
  remote: [['pad', 'Arrows and keys', '.lmg-pad'], ['hint', '"Hold an arrow" hint', '[data-item="remote-hint"]']],
  source: [['inputs', 'Inputs', '[data-row="input"]', 'show_inputs'], ['memory', 'Memory', '[data-row="memory"]', 'show_memory']],
  picture: [['cms', 'CMS', '[data-row="cms"]'], ['style', 'Style', '[data-row="style"]']],
  admin: [['hotplug', 'Hotplug', '[data-a="hotplug"]'], ['restart', 'Restart outputs', '[data-a="restart"]'],
    ['reload', 'Reload config', '[data-a="reload"]'], ['osd_test', 'OSD test', '[data-a="osd_test"]'], ['osd_clear', 'Clear OSD', '[data-a="osd_clear"]'],
    ['alt', 'ALT', '[data-a="alt"]'], ['hint', '"Hold a button" hint', '[data-item="admin-hint"]'],
    ['link', 'Link note', '[data-k="link"]'], ['missing', 'Disabled-entities note', '[data-k="missing"]']],
};
// Sections other sections can be merged into, and sections that can't be merged anywhere.
const MERGE_TARGETS = ['chain', 'aspects', 'remote', 'source', 'picture', 'admin'];
// Areas that are always visible (not a collapsed section): merged controls there can be hit by accident.
const ALWAYS_SHOWN = ['chain'];
const NOT_MERGEABLE = ['hdr'];

function defaultSectionName(id) { return ((SECTIONS.find((x) => x[0] === id) || [])[1]) || id; }

/** A section's name: the user's, else the default. */
function secLabel(config, id) {
  const n = config.section_names && config.section_names[id];
  return n || defaultSectionName(id);
}

function sectionShown(config, id) { return !!(cfg(config, ((SECTIONS.find((x) => x[0] === id) || [])[3] || ['show_' + id])[0])); }

/** The section a section is merged into, or '' when it shows as itself (none set, invalid, chained, or either one hidden). */
function mergeTarget(config, id) {
  const m = config.section_merge || {};
  const t = m[id];
  if (!t || t === id || !MERGE_TARGETS.includes(t) || NOT_MERGEABLE.includes(id) || m[t]) return '';
  if (Object.keys(m).some((k) => m[k] === id)) return '';
  if (!sectionShown(config, id) || !sectionShown(config, t)) return '';
  return t;
}

function normalizeSectionEdits(c, out) {
  const known = (id) => SECTION_ITEMS[id] !== undefined;
  if (c.section_names && typeof c.section_names === 'object') {
    const n = {};
    Object.keys(c.section_names).forEach((id) => {
      const v = String(c.section_names[id] == null ? '' : c.section_names[id]).trim();
      if (known(id) && v && v !== defaultSectionName(id)) n[id] = v;
    });
    if (Object.keys(n).length) out.section_names = n;
  }
  const ok = new Set(Object.entries(SECTION_ITEMS).flatMap(([sec, items]) => items.filter((i) => !i[3]).map((i) => `${sec}.${i[0]}`)));
  const hidden = [];
  (Array.isArray(c.hidden_items) ? c.hidden_items : []).forEach((x) => { const v = String(x).trim(); if (ok.has(v) && !hidden.includes(v)) hidden.push(v); });
  if (hidden.length) out.hidden_items = hidden;
  if (c.section_merge && typeof c.section_merge === 'object') {
    const m = {};
    Object.keys(c.section_merge).forEach((id) => {
      const t = String(c.section_merge[id] == null ? '' : c.section_merge[id]).trim();
      if (known(id) && !NOT_MERGEABLE.includes(id) && MERGE_TARGETS.includes(t) && t !== id) m[id] = t;
    });
    if (Object.keys(m).length) out.section_merge = m;
  }
}

// What the card does while the device is in standby / off.
const WHEN_OFF = [['hide', 'Hide the entire card'], ['collapse', 'Collapse to the header'], ['expanded', 'Keep expanded']];
const STANDBY_TEXT = [['below', 'Below the title'], ['inline', 'Inline with the title'], ['hidden', 'Hidden']];

function normalizeConfig(raw) {
  let c = raw && typeof raw === 'object' ? raw : {};
  // Legacy `show_when_off: false` (hide the card in standby) → `when_off: hide`.
  if (c.when_off === undefined && (c.show_when_off === false || c.show_when_off === 'false')) c = { ...c, when_off: 'hide' };
  const out = {};
  if (c.type !== undefined) out.type = c.type;
  Object.keys(DEFAULTS).forEach((k) => {
    if (c[k] === undefined || c[k] === null) return;
    let v = c[k];
    const d = DEFAULTS[k];
    if (typeof d === 'boolean') v = v === true || v === 'true';
    else if (typeof d === 'number') { v = Number(v); if (!Number.isFinite(v)) return; v = Math.round(v * 100) / 100; }
    else v = String(v).trim();
    if (v === d) return;
    out[k] = v;
  });
  if (c.icons && typeof c.icons === 'object') {
    const icons = {};
    Object.keys(c.icons).forEach((k) => {
      const v = normalizeIcon(c.icons[k]);
      if (v && v !== ICON_DEFAULTS[k]) icons[k] = v;
    });
    if (Object.keys(icons).length) out.icons = icons;
  }
  if (c.styles && typeof c.styles === 'object') {
    const styles = {};
    Object.keys(c.styles).forEach((k) => {
      const def = STYLE_INDEX[k];
      let v = c.styles[k];
      if (v === undefined || v === null || v === '') return;
      if (!def) { styles[k] = v; return; } // unknown (newer build): keep verbatim
      if (def[2] === 'size') {
        v = Number(v);
        if (!Number.isFinite(v) || v === def[4]) return;
        v = Math.round(Math.min(def[6], Math.max(def[5], v)));
        if (v === def[4]) return;
      } else v = String(v).trim();
      if (v !== '') styles[k] = v;
    });
    if (Object.keys(styles).length) out.styles = styles;
  }
  if (Array.isArray(c.section_order)) {
    const order = normalizeOrder(c.section_order);
    if (order.join() !== SECTION_IDS.join()) out.section_order = order;
  }
  Object.keys(HIDE_LISTS).forEach((k) => {
    if (!Array.isArray(c[k])) return;
    const seen = new Set();
    const list = [];
    c[k].forEach((v) => {
      const val = k === 'hide_inputs' && /^\d+$/.test(String(v)) ? Number(v)
        : k === 'hide_memory' ? String(v).replace(/^MEM/i, '').toUpperCase() : String(v);
      const key = JSON.stringify(val);
      if (val === '' || seen.has(key)) return;
      seen.add(key); list.push(val);
    });
    if (list.length) out[k] = list;
  });
  if (out.when_off !== undefined && !WHEN_OFF.some(([v]) => v === out.when_off)) delete out.when_off;
  normalizeSectionEdits(c, out);
  Object.keys(c).forEach((k) => {
    if (k === 'show_when_off') return; // replaced by when_off
    if (!(k in out) && !(k in DEFAULTS) && !(k in HIDE_LISTS) && !['type', 'icons', 'styles', 'section_order', 'section_names', 'hidden_items', 'section_merge'].includes(k)) out[k] = c[k];
  });
  return out;
}

function cfg(config, key) {
  return config[key] !== undefined ? config[key] : DEFAULTS[key];
}

/** Hidden ids for a hide_* list, as JSON strings (so 3 and "3" never collide by accident). */
function hiddenSet(config, key) {
  return new Set((config[key] || []).map((v) => JSON.stringify(v)));
}

function iconFor(config, key) {
  return (config.icons && config.icons[key]) || ICON_DEFAULTS[key];
}

/** Per-card custom properties (inline on the card root; never in the stylesheet). */
function rootStyleVars(config) {
  const vars = [];
  if (config.accent_color) vars.push(`--lmg-accent:${config.accent_color}`);
  if (config.hdr_color) vars.push(`--lmg-hdr:${config.hdr_color}`);
  if (config.game_color) vars.push(`--lmg-game:${config.game_color}`);
  const st = config.styles || {};
  STYLE_DEFS.forEach(([key, , kind]) => {
    if (st[key] === undefined) return;
    vars.push(`--lmg-${key.replace(/_/g, '-')}:${st[key]}${kind === 'size' ? 'px' : ''}`);
  });
  return vars.join(';');
}

/** Classes on the card root that depend on config (constant stylesheet, no interpolation). */
function rootClasses(config) {
  const st = config.styles || {};
  const cls = ['lmg'];
  if (st.card_border_color) cls.push('has-border');
  if (st.card_background === 'transparent') cls.push('is-flat');
  return cls.join(' ');
}

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------
const okState = (v) => v !== undefined && v !== null && v !== '' && v !== 'unknown' && v !== 'unavailable';

function parseAspect(v) {
  if (!okState(v)) return null;
  if (v === 'Letterbox') return 1.78;
  const n = parseFloat(v);
  return Number.isFinite(n) && n > 0.5 && n < 5 ? n : null;
}

/** Largest rect of aspect `ar` centered inside a w×h box at (x,y). */
function fitRect(x, y, w, h, ar) {
  let rw = w;
  let rh = rw / ar;
  if (rh > h) { rh = h; rw = rh * ar; }
  return { x: x + (w - rw) / 2, y: y + (h - rh) / 2, w: rw, h: rh };
}

/**
 * Geometry of what the Lumagen does, in "source units" (raster height = 100).
 *   raster   — the incoming frame (e.g. 1.78)
 *   content  — where the real picture is inside it (detected content aspect)
 *   selected — the region the Lumagen treats as the picture (its source-aspect setting).
 *              Wider than the content → the picture's top/bottom are cropped; narrower →
 *              the film's own black bars are kept.
 *   screen   — your screen; `area` is where the output aspect lands on it (usually all of it)
 *   visible  — the part of the selected region that reaches the screen
 *   picture  — where `visible` is drawn: scaled UNIFORMLY to fit the area (letterbox /
 *              pillarbox), never stretched — except with NLS.
 * NLS (a selected region narrower than the output, e.g. 16:9 on a 2.00 screen): the Lumagen
 * fills the output area. Part of the widening is a small uniform VERTICAL stretch, which
 * crops the top and bottom; the rest is the horizontal non-linear stretch (drawn linearly;
 * at this size the curve isn't visible). `nlsVertical` is that vertical stretch in percent
 * (the Lumagen's NLS vertical-stretch setting), capped so it never crops more than the
 * widening needs. `vstretch` is the factor used (1 = none).
 * Zoom is not modelled: it can't be read over RS-232.
 */
function vizGeometry({ raster, content, selected, output, screen, nls = false, nlsVertical = 0 }) {
  const W = 100 * raster;
  const scrW = 100 * screen;
  const area = fitRect(0, 0, scrW, 100, output);
  const sel = fitRect(0, 0, W, 100, selected);
  const stretching = nls && selected < output - 0.005;
  const vstretch = stretching ? Math.min(1 + Math.max(0, nlsVertical) / 100, output / selected) : 1;
  // the vertical stretch pushes the top and bottom of the selected region off the screen
  const vh = sel.h / vstretch;
  const visible = { x: sel.x, y: sel.y + (sel.h - vh) / 2, w: sel.w, h: vh };
  const picture = stretching ? { ...area } : fitRect(area.x, area.y, area.w, area.h, selected);
  return {
    source: { w: W, h: 100 },
    content: fitRect(0, 0, W, 100, content),
    selected: sel,
    visible,
    screen: { w: scrW, h: 100 },
    area,
    picture,
    vstretch,
    hstretch: stretching ? output / (selected * vstretch) : 1,
    image: picture, // kept for older callers
  };
}

/** Share of the picture height NLS crops off the top and bottom together, in percent (0 = none). */
function nlsCropPct(g) { return g.vstretch > 1 ? (1 - 1 / g.vstretch) * 100 : 0; }

/** Words for what the viewer sees on the screen. */
function vizResult({ content, selected, output, screen, nls }, g) {
  const out = [];
  const nlsCrop = nlsCropPct(g);
  if (selected > content + 0.01 || nlsCrop > 0.05) out.push('top/bottom cropped');
  else if (selected < content - 0.01) out.push('film bars kept');
  const p = g.picture;
  const bars = [];
  if (p.h < g.screen.h - 0.5) bars.push('letterboxed');
  if (p.w < g.screen.w - 0.5) bars.push('pillarboxed');
  if (nls && selected < output - 0.005) out.push('NLS stretch');
  if (bars.length) out.push(bars.length === 2 ? 'windowboxed' : bars[0]);
  if (!out.length) out.push(Math.abs(screen - output) < 0.005 ? 'fills the screen' : 'fills the output area');
  return out.join(' · ');
}

function fmtVideo(res, mode, rate) {
  if (!okState(res) || Number(res) === 0) return '—';
  return `${res}${mode === 'Interlaced' ? 'i' : 'p'}${okState(rate) && Number(rate) ? rate : ''}`;
}

/** 'Apple TV (2)' → 'Apple TV'; generic 'Input (2)' → 'Input 2'. */
function chipLabel(option) {
  const m = /^(.*) \((\d+)\)$/.exec(option);
  if (!m) return option;
  return ['Input', 'CMS', 'Style'].includes(m[1]) ? `${m[1]} ${m[2]}` : m[1];
}

/** Make `from`'s children match `to`'s (a parsed template) while keeping every element that is
 *  still the same tag in place. The card is patched instead of rebuilt on each config change, so
 *  the editor preview doesn't flash: icons, open sections and listeners stay. */
function morphChildren(from, to) {
  const a = [...from.childNodes];
  const b = [...to.childNodes];
  b.forEach((nb, i) => {
    const na = a[i];
    if (!na) { from.appendChild(nb); return; }
    if (na.nodeType !== nb.nodeType || na.nodeName !== nb.nodeName) { from.replaceChild(nb, na); return; }
    if (na.nodeType === 3 || na.nodeType === 8) { if (na.nodeValue !== nb.nodeValue) na.nodeValue = nb.nodeValue; return; }
    if (na.nodeType !== 1) return;
    [...na.attributes].forEach((at) => { if (!nb.hasAttribute(at.name)) na.removeAttribute(at.name); });
    [...nb.attributes].forEach((at) => { if (na.getAttribute(at.name) !== at.value) na.setAttribute(at.name, at.value); });
    if (na.localName === 'details') na.open = nb.hasAttribute('open');
    morphChildren(na, nb.localName === 'template' ? nb.content : nb);
  });
  a.slice(b.length).forEach((n) => n.remove());
}

// After a hold runs, the click that ends it is ignored for this long (a later tap is a new tap).
const HOLD_CLICK_MS = 1500;

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const f2 = (n) => Number(n).toFixed(2);
const f1 = (n) => Number(n).toFixed(1);

// Built-in picture for the visualizer: a license-free landscape drawn as SVG, with
// detail at the edges (trees) and top/bottom (sun, lake) so cropping is obvious.
const SCENE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f6fc0"/><stop offset=".55" stop-color="#8fc0e8"/><stop offset=".72" stop-color="#f3d7a7"/></linearGradient>
<linearGradient id="w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6aa3cf"/><stop offset="1" stop-color="#1f4f7a"/></linearGradient></defs>
<rect width="1600" height="900" fill="url(#s)"/>
<circle cx="800" cy="300" r="70" fill="#fff4c9"/><circle cx="800" cy="300" r="110" fill="#fff4c9" opacity=".25"/>
<g fill="#fff" opacity=".85"><ellipse cx="300" cy="150" rx="120" ry="28"/><ellipse cx="380" cy="135" rx="80" ry="26"/><ellipse cx="1250" cy="200" rx="140" ry="30"/><ellipse cx="1170" cy="185" rx="70" ry="22"/></g>
<path d="M0 560 L230 380 L380 470 L560 330 L760 500 L930 360 L1120 480 L1300 340 L1600 520 L1600 620 L0 620Z" fill="#6f86a8"/>
<path d="M0 600 L300 470 L520 560 L760 450 L1000 570 L1260 460 L1600 580 L1600 660 L0 660Z" fill="#4f6b52"/>
<rect y="640" width="1600" height="260" fill="url(#w)"/>
<ellipse cx="800" cy="700" rx="90" ry="10" fill="#fff4c9" opacity=".6"/>
<path d="M0 640 C300 610 500 650 800 630 C1100 610 1300 650 1600 630 L1600 660 L0 660Z" fill="#3d5a3f"/>
<g fill="#24402a"><path d="M60 660 L120 380 L180 660Z"/><path d="M150 660 L215 430 L280 660Z"/><path d="M1420 660 L1485 400 L1550 660Z"/><path d="M1330 660 L1385 460 L1440 660Z"/></g>
<path d="M0 840 C400 800 1200 880 1600 830 L1600 900 L0 900Z" fill="#c9b48a"/>
</svg>`;
const SCENE_URL = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(SCENE_SVG)}`;

// ---------------------------------------------------------------------------
// Card stylesheet — CONSTANT (identical for every instance; see design system §0.9)
// ---------------------------------------------------------------------------
const CARD_CSS = `
.lmg { --lmg-ctx: var(--lmg-accent, var(--primary-color, #2196F3));
  --lmg-box: var(--lmg-box-background, rgba(127,127,127,0.10));
  padding: var(--lmg-card-padding, 12px) calc(var(--lmg-card-padding, 12px) + 2px) calc(var(--lmg-card-padding, 12px) - 2px);
  overflow: hidden; background: var(--lmg-card-background, var(--ha-card-background, var(--card-background-color)));
  border-radius: var(--lmg-card-radius, var(--ha-card-border-radius, 12px)); }
.lmg.has-border { border: var(--ha-card-border-width, 1px) solid var(--lmg-card-border-color); }
.lmg.is-flat { box-shadow: none; }
.lmg.is-hdr { --lmg-ctx: var(--lmg-hdr, #ffb300); }
.lmg.is-game { --lmg-ctx: var(--lmg-game, #4caf50); }
.lmg [hidden] { display: none !important; }
/* Buttons with a hold: no text selection or callout on a long-press (iOS / Android). */
.lmg button { font: inherit; -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; -webkit-tap-highlight-color: transparent; }
.lmg-head { display: flex; align-items: center; gap: 10px; min-height: 36px; }
.lmg-power { flex: 0 0 auto; width: calc(var(--lmg-header-icon-size, 22px) + 14px); height: calc(var(--lmg-header-icon-size, 22px) + 14px);
  border-radius: 50%; border: none; cursor: pointer; background: transparent; color: var(--disabled-text-color, #777);
  display: flex; align-items: center; justify-content: center; transition: background .2s, color .2s;
  --mdc-icon-size: var(--lmg-header-icon-size, 22px); }
.lmg.is-on .lmg-power { color: var(--lmg-header-icon-color, var(--lmg-ctx)); background: color-mix(in srgb, var(--lmg-header-icon-color, var(--lmg-ctx)) 16%, transparent); }
.lmg-title { display: flex; align-items: center; gap: 8px; min-width: 0; font-size: var(--lmg-title-size, 16px); font-weight: 500; white-space: nowrap;
  color: var(--lmg-title-color, var(--primary-text-color)); }
.lmg-dot { flex: 0 0 auto; width: 8px; height: 8px; border-radius: 50%; background: var(--disabled-text-color, #777); }
.lmg-dot.at-right { margin-left: 2px; }
.lmg-dot.at-icon { width: calc(var(--lmg-header-icon-size, 22px) * .6); height: calc(var(--lmg-header-icon-size, 22px) * .6); }
.lmg-dot.ok { background: var(--success-color, #4caf50); }
.lmg-dot.bad { background: var(--error-color, #f44336); }
.lmg-summary { margin-left: auto; min-width: 0; font-size: var(--lmg-summary-size, 13px); color: var(--lmg-summary-color, var(--secondary-text-color));
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.lmg.is-down .lmg-summary { color: var(--error-color, #f44336); }
.lmg-head.is-tap { cursor: pointer; }
.lmg-hchev { color: var(--secondary-text-color); --mdc-icon-size: 20px; transition: transform .2s; flex: 0 0 auto; }
.lmg.is-collapsed .lmg-hchev { transform: rotate(-90deg); }
.lmg.is-collapsed .lmg-body { display: none; }
.lmg-sb-inline { margin-left: max(0px, calc(var(--lmg-standby-indent, 46px) - 46px)); font-size: var(--lmg-secondary-size, 12px); font-weight: 400; color: var(--lmg-secondary-color, var(--secondary-text-color));
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.lmg-pwr2 { margin-left: auto; flex: 0 0 auto; width: 34px; height: 34px; border-radius: 50%; border: none; cursor: pointer;
  background: var(--lmg-box); color: var(--lmg-header-icon-color, var(--lmg-ctx)); display: flex; align-items: center; justify-content: center;
  --mdc-icon-size: 20px; }
.lmg-pwr2:hover { background: color-mix(in srgb, var(--lmg-ctx) 20%, transparent); }
.lmg-standby { padding: 2px 0 2px var(--lmg-standby-indent, 46px); font-size: var(--lmg-secondary-size, 13px); color: var(--lmg-secondary-color, var(--secondary-text-color)); }
.lmg-chain { display: flex; gap: 6px; margin-top: 10px; }
.lmg-chain > .lmg-box { flex: 1 1 0; }
.lmg-uhide, .lmg-away { display: none !important; }
.lmg-merged { margin-top: 10px; padding-top: 8px; border-top: 1px solid var(--lmg-divider-color, rgba(127,127,127,0.2)); }
.lmg-merged-h { margin-bottom: 4px; font-size: var(--lmg-subtitle-size, 10px); letter-spacing: .08em; text-transform: uppercase;
  color: var(--lmg-subtitle-color, var(--secondary-text-color)); }
.lmg-box { min-width: 0; padding: 8px 6px; border-radius: 10px; text-align: center; background: var(--lmg-box); }
.lmg-box-h { font-size: var(--lmg-subtitle-size, 10px); letter-spacing: .08em; text-transform: uppercase; color: var(--lmg-subtitle-color, var(--secondary-text-color)); }
.lmg-box-t { font-size: var(--lmg-text-size, 14px); font-weight: 600; color: var(--lmg-text-color, var(--primary-text-color));
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.lmg-box-s { font-size: var(--lmg-secondary-size, 12px); color: var(--lmg-secondary-color, var(--secondary-text-color));
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.lmg-arrow { align-self: center; color: var(--lmg-icon-color, var(--lmg-ctx)); --mdc-icon-size: 18px; }
.lmg-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.lmg-tags:empty { display: none; }
.lmg-tag { padding: 1px 8px; border: 1px solid currentColor; border-radius: 999px; font-size: 11px; font-weight: 600;
  letter-spacing: .04em; color: var(--secondary-text-color); }
.lmg-tag.hdr { color: var(--lmg-hdr, #ffb300); }
.lmg-tag.game { color: var(--lmg-game, #4caf50); }
.lmg-tag.ctx { color: var(--lmg-ctx); }
.lmg-tag.bad { color: var(--error-color, #f44336); }
.lmg-viz { display: flex; align-items: flex-start; justify-content: center; gap: 12px; margin-top: 12px; }
.lmg-scr { display: flex; flex-direction: column; align-items: center; min-width: 0; }
.lmg-scr > svg { display: block; height: var(--lmg-viz-height, 72px); width: auto; max-width: 100%; overflow: visible; }
.lmg-viz-arrow { align-self: flex-start; margin-top: calc(var(--lmg-viz-height, 72px) / 2 - 9px); color: var(--lmg-icon-color, var(--secondary-text-color)); --mdc-icon-size: 18px; }
.lmg-cap { margin-top: 4px; text-align: center; font-size: var(--lmg-caption-size, 11px); line-height: 1.35;
  color: var(--lmg-caption-color, var(--secondary-text-color)); }
.lmg-cap b { color: var(--lmg-text-color, var(--primary-text-color)); font-weight: 600; }
.lmg-frame { fill: #000; }
.lmg-edge { fill: none; stroke: var(--lmg-viz-border-color, rgba(127,127,127,0.6)); stroke-width: var(--lmg-viz-border-width, 2px); vector-effect: non-scaling-stroke; }
.lmg-sel { fill: none; stroke: var(--lmg-ctx); stroke-width: 1.5; stroke-dasharray: 4 3; vector-effect: non-scaling-stroke; }
.lmg-wall { fill: rgba(127,127,127,0.18); }
.lmg-hdrp { margin-top: 8px; font-size: var(--lmg-secondary-size, 12px); color: var(--lmg-secondary-color, var(--secondary-text-color)); }
.lmg-hdrp b { color: var(--lmg-text-color, var(--primary-text-color)); }
.lmg-bar { position: relative; height: 6px; margin-top: 4px; border-radius: 3px; background: rgba(127,127,127,0.2); overflow: hidden; }
.lmg-bar > span { position: absolute; inset: 0 auto 0 0; border-radius: 3px; background: var(--lmg-hdr, #ffb300); transition: width .4s ease; }
.lmg-fold { margin-top: 10px; border-top: 1px solid var(--lmg-divider-color, rgba(127,127,127,0.2)); }
.lmg-fold > summary { display: flex; align-items: center; gap: 8px; padding: 8px 0 2px; cursor: pointer; list-style: none;
  font-size: var(--lmg-section-title-size, 14px); color: var(--lmg-section-title-color, var(--primary-text-color)); user-select: none; }
.lmg-fold > summary::-webkit-details-marker { display: none; }
.lmg-fold > summary .lmg-sec-i { color: var(--lmg-section-icon-color, var(--lmg-ctx)); --mdc-icon-size: var(--lmg-section-icon-size, 18px); }
.lmg-fold > summary .lmg-chev { margin-left: auto; color: var(--secondary-text-color); --mdc-icon-size: 18px; transition: transform .2s; }
.lmg-fold[open] > summary .lmg-chev { transform: rotate(90deg); }
.lmg-fold > summary .lmg-peek { font-size: var(--lmg-secondary-size, 12px); color: var(--lmg-secondary-color, var(--secondary-text-color));
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
.lmg-row { display: flex; align-items: flex-start; gap: 8px; margin-top: 8px; }
.lmg-row-l { flex: 0 0 56px; padding-top: 6px; font-size: var(--lmg-subtitle-size, 12px); color: var(--lmg-subtitle-color, var(--secondary-text-color)); }
.lmg-opts { display: flex; flex-wrap: wrap; gap: 6px; min-width: 0; }
.lmg-chip { padding: 5px 10px; border: 1px solid var(--lmg-chip-border-color, rgba(127,127,127,0.35)); border-radius: 8px; cursor: pointer;
  background: var(--lmg-chip-background, transparent); color: var(--lmg-chip-color, var(--primary-text-color));
  font-size: var(--lmg-chip-size, 13px); white-space: nowrap; transition: background .2s, border-color .2s; }
.lmg-chip:hover { border-color: var(--lmg-ctx); }
.lmg-chip.on { background: var(--lmg-ctx); border-color: var(--lmg-ctx); color: #fff; }
.lmg-chip.act { border-style: dashed; color: var(--lmg-ctx); }
.lmg-armed { outline: 2px dashed var(--lmg-ctx); outline-offset: 2px; }
.lmg-held { outline: 2px solid var(--lmg-ctx); outline-offset: 1px; }
.lmg.is-off .lmg-ctl, .lmg.is-down .lmg-ctl { opacity: .45; pointer-events: none; }
.lmg.is-down [data-sec="chain"] .lmg-chain, .lmg.is-down [data-sec="visualizer"], .lmg.is-down [data-sec="hdr"] { opacity: .45; }
.lmg-pad { display: grid; grid-template-columns: repeat(3, 64px); grid-auto-rows: 44px; gap: 6px; justify-content: center; margin-top: 6px; }
.lmg-key { display: flex; align-items: center; justify-content: center; border: none; border-radius: 10px; cursor: pointer;
  background: var(--lmg-box); color: var(--lmg-icon-color, var(--primary-text-color)); font-size: var(--lmg-chip-size, 12px);
  --mdc-icon-size: var(--lmg-icon-size, 22px); }
.lmg-key:hover { background: color-mix(in srgb, var(--lmg-ctx) 20%, transparent); }
.lmg-key.ok { background: color-mix(in srgb, var(--lmg-ctx) 30%, transparent); color: var(--lmg-ctx); }
.lmg-key.sm { color: var(--lmg-chip-color, var(--secondary-text-color)); }
.lmg-admin { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 6px; margin-top: 6px; }
.lmg-admin .lmg-chip { text-align: center; }
.lmg-note { margin-top: 8px; font-size: var(--lmg-secondary-size, 12px); line-height: 1.5; color: var(--lmg-secondary-color, var(--secondary-text-color)); }
.lmg-note.bad { color: var(--error-color, #f44336); }
.lmg-hint { margin-top: 4px; font-size: 11px; color: var(--secondary-text-color); text-align: center; }
`;

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------
class LumagenCard extends HTMLElement {
  static getConfigElement() { return document.createElement(EDITOR_TAG); }
  static getStubConfig() { return {}; }

  constructor() {
    super();
    this._config = {};
    this._built = false;
    this._sig = '';
    this._optSig = {};
    this._timer = null;
    this._press = null;
    this._editMode = false;
    this._preview = false;
    this._open = new Set(); // sections the user has opened (survives config changes)
  }

  setConfig(config) {
    if (!config || typeof config !== 'object') throw new Error('Invalid configuration');
    const next = normalizeConfig(config);
    if (this._built && JSON.stringify(next) === JSON.stringify(this._config)) return;
    if (cfg(next, 'start_collapsed') !== cfg(this._config, 'start_collapsed') || cfg(next, 'collapsible') !== cfg(this._config, 'collapsible')) {
      this._collapsed = undefined; // re-apply the configured starting state
    }
    this._config = next;
    this._built = false;
    if (this._hass) this._build();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._built) this._build();
    else this._schedule();
  }

  set editMode(v) { this._editMode = !!v; this._applyVisibility(); }
  set preview(v) { this._preview = !!v; this._applyVisibility(); }

  connectedCallback() { this._applyVisibility(); }

  /**
   * True while the Dashboard is being edited or this card is the editor preview.
   * HA does not always pass `preview` / `editMode` to the card element, so also
   * look for the editor's wrappers among the ancestors (crossing shadow roots).
   */
  _editing() {
    if (this._editMode || this._preview) return true;
    let n = this.parentNode || (this.getRootNode && this.getRootNode().host);
    for (let i = 0; n && i < 40; i++) {
      const tag = (n.localName || '').toLowerCase();
      if (EDITOR_WRAPPERS.includes(tag)) return true;
      if (n.hasAttribute && (n.hasAttribute('preview') || n.hasAttribute('edit-mode'))) return true;
      n = n.parentNode || n.host;
    }
    return false;
  }

  getCardSize() { return 6; }
  getGridOptions() { return { columns: 12, min_columns: 6, rows: 'auto' }; }

  _schedule() {
    if (this._timer) return;
    this._timer = setTimeout(() => { this._timer = null; this._update(false); }, 250);
  }

  // -- build once -----------------------------------------------------------
  /** First build: plain innerHTML. Later: patch the existing DOM (see morphChildren). */
  _setHTML(html) {
    if (!this.querySelector('ha-card')) { this.innerHTML = html; return; }
    const tpl = document.createElement('template');
    tpl.innerHTML = html;
    morphChildren(this, tpl.content);
  }

  /** True the first time for this element + key: listeners survive a patch, so bind them once. */
  _once(el, key) {
    if (!el) return false;
    if (!this._wired) this._wired = new WeakMap();
    const done = this._wired.get(el) || new Set();
    if (done.has(key)) return false;
    done.add(key);
    this._wired.set(el, done);
    return true;
  }

  _build() {
    const c = this._config;
    const fold = (sec, iconKey, label, body) => `
      <details class="lmg-fold" data-sec="${sec}"${this._open.has(sec) ? ' open' : ''}>
        <summary><ha-icon class="lmg-sec-i" icon="${esc(iconFor(c, iconKey))}"></ha-icon><span>${c.section_names && c.section_names[sec] ? esc(c.section_names[sec]) : label}</span>
          <span class="lmg-peek" data-peek="${sec}"></span><ha-icon class="lmg-chev" icon="mdi:chevron-right"></ha-icon></summary>
        ${body}
      </details>`;
    const key = (cmd, inner, cls = '', hold = '') =>
      `<button class="lmg-key ${cls}" data-tap="remote" data-cmd="${cmd}"${hold ? ' data-hold="remote-repeat"' : ''} aria-label="${cmd}">${inner}</button>`;
    const admin = (id, label) => `<button class="lmg-chip" data-hold="${id}" data-a="${id}">${label}</button>`;
    const afterOnly = cfg(c, 'viz_after_only');
    const standbyText = esc(cfg(c, 'standby_message') || `Standby · ${cfg(c, 'power_hold_on') ? 'hold' : 'tap'} the icon to power on`);
    const dotAt = cfg(c, 'show_dot') ? cfg(c, 'dot_position') : 'none';
    const dot = (where) => (dotAt === where ? `<span class="lmg-dot at-${where}" data-k="dot" data-pos="${where}"></span>` : '');
    if (this._collapsed === undefined) this._collapsed = cfg(c, 'collapsible') && cfg(c, 'start_collapsed');
    const parts = {
      chain: `
          <div data-sec="chain">
            <div class="lmg-chain">
              <div class="lmg-box" data-item="box-src"><div class="lmg-box-h">Source</div><div class="lmg-box-t" data-k="s_t"></div><div class="lmg-box-s" data-k="s_1"></div><div class="lmg-box-s" data-k="s_2"></div></div>
              <ha-icon class="lmg-arrow" icon="mdi:chevron-right"></ha-icon>
              <div class="lmg-box" data-item="box-lmg"><div class="lmg-box-h">Lumagen</div><div class="lmg-box-t" data-k="l_t"></div><div class="lmg-box-s" data-k="l_1"></div><div class="lmg-box-s" data-k="l_2"></div></div>
              <ha-icon class="lmg-arrow" icon="mdi:chevron-right"></ha-icon>
              <div class="lmg-box" data-item="box-disp"><div class="lmg-box-h">${esc(cfg(c, 'display_name'))}</div><div class="lmg-box-t" data-k="d_t"></div><div class="lmg-box-s" data-k="d_1"></div><div class="lmg-box-s" data-k="d_2"></div></div>
            </div>
            <div class="lmg-tags" data-k="tags"></div>
          </div>
`,
      visualizer: `
          <div class="lmg-viz" data-sec="visualizer">
            <div class="lmg-scr" data-k="before"${afterOnly ? ' hidden' : ''}>
              <svg data-v="src" aria-label="Source frame">
                <rect class="lmg-frame" data-v="src-frame"></rect>
                <image data-v="src-img" preserveAspectRatio="xMidYMid slice"></image>
                <rect class="lmg-sel" data-v="src-sel"></rect>
                <rect class="lmg-edge" data-v="src-edge"></rect>
              </svg>
              <div class="lmg-cap" data-k="cap_before"></div>
            </div>
            <ha-icon class="lmg-viz-arrow" icon="mdi:arrow-right"${afterOnly ? ' hidden' : ''}></ha-icon>
            <div class="lmg-scr" data-item="viz-after">
              <svg data-v="scr" aria-label="Screen">
                <rect class="lmg-wall" data-v="scr-wall"></rect>
                <rect class="lmg-frame" data-v="scr-area"></rect>
                <svg data-v="out" preserveAspectRatio="none">
                  <rect class="lmg-frame" data-v="out-frame"></rect>
                  <image data-v="out-img" preserveAspectRatio="xMidYMid slice"></image>
                </svg>
                <rect class="lmg-edge" data-v="scr-edge"></rect>
              </svg>
              <div class="lmg-cap" data-k="cap_after"></div>
            </div>
          </div>
`,
      hdr: `
          <div class="lmg-hdrp" data-sec="hdr" data-k="hdr"></div>
`,
      aspects: fold('aspects', 'aspect', 'Aspect', `
            <div class="lmg-ctl"><div class="lmg-row" data-row="aspect"><div class="lmg-opts">
              <span class="lmg-opts" data-opts="aspect"></span>
              <button class="lmg-chip act" data-tap="nls" data-a="nls_btn">NLS</button>
              <button class="lmg-chip act" data-tap="reset_aa" data-a="reset_aa">Reset auto</button>
            </div></div></div>`),
      remote: fold('remote', 'remote', 'Remote', `
            <div class="lmg-ctl"><div class="lmg-pad">
              ${key('menu', 'Menu', 'sm')}${key('up', '<ha-icon icon="mdi:chevron-up"></ha-icon>', '', 1)}${key('exit', 'Exit', 'sm')}
              ${key('left', '<ha-icon icon="mdi:chevron-left"></ha-icon>', '', 1)}${key('ok', 'OK', 'ok')}${key('right', '<ha-icon icon="mdi:chevron-right"></ha-icon>', '', 1)}
              ${key('clear', 'Clear', 'sm')}${key('down', '<ha-icon icon="mdi:chevron-down"></ha-icon>', '', 1)}${key('help', 'Help', 'sm')}
            </div>
            <div class="lmg-hint" data-item="remote-hint">Hold an arrow to repeat it 5×</div></div>`),
      source: fold('source', 'source', 'Source', `
            <div class="lmg-ctl">
              <div class="lmg-row" data-row="input" data-opt-sec="inputs"><div class="lmg-row-l">Input</div><div class="lmg-opts" data-opts="input"></div></div>
              <div class="lmg-row" data-row="memory" data-opt-sec="memory"><div class="lmg-row-l">Memory</div><div class="lmg-opts" data-opts="memory"></div></div>
            </div>`),
      picture: fold('picture', 'picture', 'Picture', `
            <div class="lmg-ctl">
              <div class="lmg-row" data-row="cms"><div class="lmg-row-l">CMS</div><div class="lmg-opts" data-opts="cms"></div></div>
              <div class="lmg-row" data-row="style"><div class="lmg-row-l">Style</div><div class="lmg-opts" data-opts="style"></div></div>
            </div>`),
      admin: fold('admin', 'admin', 'Admin & link', `
            <div class="lmg-admin">
              ${admin('hotplug', 'Hotplug')}${admin('restart', 'Restart outputs')}${admin('reload', 'Reload config')}
              ${admin('osd_test', 'OSD test')}${admin('osd_clear', 'Clear OSD')}${admin('alt', 'ALT')}
            </div>
            <div class="lmg-hint" data-item="admin-hint">Hold a button to run it</div>
            <div class="lmg-note" data-k="link"></div>
            <div class="lmg-note" data-k="missing"></div>`),
    };
    this._setHTML(`
      <style>${CARD_CSS}</style>
      <ha-card class="${rootClasses(c)}" style="${esc(rootStyleVars(c))}">
        <div class="lmg-head${cfg(c, 'collapsible') ? ' is-tap' : ''}"${cfg(c, 'collapsible') ? ' data-tap="collapse"' : ''}>
          <button class="lmg-power" data-tap="power" data-hold="power-hold" aria-label="Power">${dotAt === 'icon' ? dot('icon') : `<ha-icon icon="${esc(iconFor(c, 'header'))}"></ha-icon>`}</button>
          <div class="lmg-title"><span>${esc(cfg(c, 'title'))}</span>${dot('title')}
            <span class="lmg-sb-inline" data-k="standby_inline" hidden>${standbyText}</span></div>
          <div class="lmg-summary" data-k="summary"></div>${dot('right')}
          <button class="lmg-pwr2" data-tap="power" data-hold="power-hold" data-k="pwr2" aria-label="Power on" hidden><ha-icon icon="mdi:power"></ha-icon></button>
          <ha-icon class="lmg-hchev" data-k="hchev" icon="mdi:chevron-down" hidden></ha-icon>
        </div>
        <div class="lmg-standby" data-k="standby" hidden>${standbyText}</div>
        <div class="lmg-body" data-k="body">
          ${normalizeOrder(c.section_order).map((id) => parts[id]).join('')}
        </div>
      </ha-card>`);
    this._root = this.querySelector('.lmg');
    this._k = {};
    this.querySelectorAll('[data-k]').forEach((el) => { this._k[el.dataset.k] = el; });
    this._applyLayout();
    this._v = {};
    this.querySelectorAll('[data-v]').forEach((el) => { this._v[el.dataset.v] = el; });
    const scene = cfg(c, 'scene_image') || SCENE_URL;
    ['src-img', 'out-img'].forEach((k) => {
      this._v[k].setAttribute('href', scene);
      this._v[k].setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', scene);
    });
    this.querySelectorAll('details.lmg-fold').forEach((d) => this._once(d, 'toggle') && d.addEventListener('toggle', () => {
      if (d.open) this._open.add(d.dataset.sec); else this._open.delete(d.dataset.sec);
    }));
    if (this._once(this._root, 'bind')) this._bind();
    this._built = true;
    this._sig = '';
    this._optSig = {};
    this._update(true);
  }

  // -- input handling ---------------------------------------------------------
  _bind() {
    const root = this._root;
    const target = (e) => e.target.closest && e.target.closest('[data-tap],[data-hold],[data-opt]');
    // Leaving the button (or a cancelled pointer) stops a hold that hasn't fired yet. A hold that already
    // ran is kept, so the click that follows it is swallowed: on touch screens the browser sends
    // pointerleave right after pointerup, before that click.
    const cancel = () => {
      if (!this._press) return;
      clearTimeout(this._press.timer);
      if (!this._press.held) this._press = null;
    };
    root.addEventListener('pointerdown', (e) => {
      const el = target(e);
      if (!el || el.dataset.opt !== undefined || !el.dataset.hold) return;
      el.addEventListener('pointerleave', cancel, { once: true }); // sliding off the button cancels the hold
      const press = { el, held: false };
      press.timer = setTimeout(() => {
        press.held = true;
        press.heldAt = Date.now();
        el.classList.add('lmg-held');
        setTimeout(() => el.classList.remove('lmg-held'), 300);
        this._run(el.dataset.hold, el);
      }, 500);
      this._press = press;
    });
    root.addEventListener('pointerleave', cancel);
    root.addEventListener('pointercancel', cancel);
    root.addEventListener('contextmenu', (e) => { if (target(e)) e.preventDefault(); });
    root.addEventListener('click', (e) => {
      const el = target(e);
      if (!el) return;
      const press = this._press;
      this._press = null;
      if (press) clearTimeout(press.timer);
      if (press && press.el === el && press.held && Date.now() - press.heldAt < HOLD_CLICK_MS) return; // hold already ran
      if (el.dataset.opt !== undefined) { this._select(el.dataset.ent, el.dataset.opt); return; }
      if (el.dataset.tap) this._run(el.dataset.tap, el);
      else if (el.dataset.hold) this._confirm(el, el.dataset.hold, 'Hold to run it');
    });
  }

  /** A hold-only action from a tap, Enter or assistive tech: the first asks, a second within 4 s confirms. */
  _confirm(el, action, message) {
    const armed = this._armed;
    this._armed = null;
    this.querySelectorAll('.lmg-armed').forEach((b) => b.classList.remove('lmg-armed'));
    if (armed && armed.el === el && armed.action === action && Date.now() - armed.at < 4000) { this._run(action, el); return; }
    this._armed = { el, action, at: Date.now() };
    el.classList.add('lmg-armed');
    setTimeout(() => { if (this._armed && this._armed.el === el && Date.now() - this._armed.at >= 3990) { this._armed = null; el.classList.remove('lmg-armed'); } }, 4000);
    this._toast(`${message}, or tap again to confirm`);
  }

  _toast(message) {
    this.dispatchEvent(new CustomEvent('hass-notification', { detail: { message }, bubbles: true, composed: true }));
  }

  _call(domain, service, data) {
    if (!this._hass) return;
    Promise.resolve(this._hass.callService(domain, service, data)).catch((err) => this._toast(`Lumagen: ${err && err.message ? err.message : err}`));
  }

  _select(entityId, option) {
    if (entityId) this._call('select', 'select_option', { entity_id: entityId, option });
  }

  _run(action, el) {
    const E = this._ents || {};
    const remote = E.remote;
    const press = (k) => E[k] && this._call('button', 'press', { entity_id: E[k] });
    switch (action) {
      case 'power': {
        // Standby always needs a hold; turning on needs one only when power_hold_on is set.
        if (this._isOn()) this._confirm(el, 'power-hold', 'Hold to put the Lumagen in standby');
        else if (cfg(this._config, 'power_hold_on')) this._confirm(el, 'power-hold', 'Hold to turn the Lumagen on');
        else if (E.power) this._call('switch', 'turn_on', { entity_id: E.power });
        break;
      }
      case 'power-hold':
        if (E.power) this._call('switch', this._isOn() ? 'turn_off' : 'turn_on', { entity_id: E.power });
        break;
      case 'collapse':
        if (!this._isOn()) break;
        this._collapsed = !this._collapsed;
        this._applyCollapse();
        break;
      case 'remote': if (remote) this._call('remote', 'send_command', { entity_id: remote, command: el.dataset.cmd }); break;
      case 'remote-repeat':
        if (remote) this._call('remote', 'send_command', { entity_id: remote, command: el.dataset.cmd, num_repeats: 5, delay_secs: 0.15 });
        break;
      case 'nls': press('nls_btn'); break;
      case 'reset_aa': press('reset_aa'); break;
      case 'restart': press('restart'); break;
      case 'reload': press('reload'); this._toast('Reloading labels and identity — this can take a minute'); break;
      case 'hotplug': if (remote) this._call('lumagen', 'hotplug', { entity_id: remote }); break;
      case 'osd_test': if (remote) this._call('lumagen', 'show_osd_volume', { entity_id: remote, value: 42 }); break;
      case 'osd_clear': if (remote) this._call('lumagen', 'clear_osd_message', { entity_id: remote }); break;
      case 'alt': if (remote) this._call('remote', 'send_command', { entity_id: remote, command: 'alt' }); break;
      default: break;
    }
  }

  _isOn() {
    const E = this._ents || {};
    return !!(this._hass && E.power && this._hass.states[E.power] && this._hass.states[E.power].state === 'on');
  }

  /** Merge sections into others (section_merge): move their content to the end of the target, under their name. */
  _applyLayout() {
    const c = this._config;
    normalizeOrder(c.section_order).forEach((id) => {
      const target = mergeTarget(c, id);
      if (!target) return;
      const from = this.querySelector(`[data-sec="${id}"]`);
      const to = this.querySelector(`[data-sec="${target}"]`);
      if (!from || !to) return;
      const wrap = document.createElement('div');
      wrap.className = 'lmg-merged';
      wrap.dataset.from = id;
      wrap.innerHTML = `<div class="lmg-merged-h">${esc(secLabel(c, id))}</div>`;
      [...from.children].filter((el) => el.tagName !== 'SUMMARY').forEach((el) => wrap.appendChild(el));
      to.appendChild(wrap);
      from.classList.add('lmg-away');
    });
  }

  /** Hide the settings the user hid (hidden_items); a status arrow shows only between two visible boxes. */
  _applyItems() {
    const c = this._config;
    const hidden = new Set(c.hidden_items || []);
    Object.entries(SECTION_ITEMS).forEach(([sec, items]) => items.forEach(([id, , sel, key]) => {
      if (key || !sel) return;
      const off = hidden.has(`${sec}.${id}`);
      this.querySelectorAll(sel).forEach((el) => el.classList.toggle('lmg-uhide', off));
    }));
    this.querySelectorAll('.lmg-chain').forEach((chain) => {
      const kids = [...chain.children];
      const boxes = kids.filter((el) => el.classList.contains('lmg-box'));
      const shown = boxes.filter((el) => !el.classList.contains('lmg-uhide'));
      kids.forEach((el) => { if (el.classList.contains('lmg-arrow')) el.classList.add('lmg-uhide'); });
      shown.slice(1).forEach((b) => {
        const prev = kids[kids.indexOf(b) - 1];
        if (prev && prev.classList.contains('lmg-arrow')) prev.classList.remove('lmg-uhide');
      });
      chain.classList.toggle('lmg-uhide', boxes.length > 0 && shown.length === 0);
    });
  }

  _applyCollapse() {
    if (!this._built) return;
    const can = cfg(this._config, 'collapsible') && this._powerState === 'on';
    // Like HA's Conditional card: never hide content while the Dashboard is being edited.
    const collapsed = can && !!this._collapsed && !this._editing();
    this._root.classList.toggle('is-collapsed', collapsed);
    this._k.hchev.hidden = !can;
  }

  // -- visibility -------------------------------------------------------------
  _applyVisibility() {
    if (!this._built) return;
    const editing = this._editing();
    const mode = cfg(this._config, 'when_off');
    const hide = mode === 'hide' && this._powerState === 'off' && !editing;
    this.style.display = hide ? 'none' : '';
    // In standby the body collapses to the header unless when_off is 'expanded'; the editor always shows it.
    if (this._k && this._k.body) this._k.body.hidden = !this._found || (this._standbyNow && mode !== 'expanded' && !editing);
    this._applyCollapse();
  }

  // -- live patching ----------------------------------------------------------
  _update(force) {
    const h = this._hass;
    if (!h || !this._built) return;
    const c = this._config;
    const E = (this._ents = resolveEntities(h, cfg(c, 'device')));
    const st = (k) => (E[k] ? h.states[E[k]] : undefined);
    const v = (k) => { const s = st(k); return s ? s.state : undefined; };
    const sig = JSON.stringify(Object.keys(ENTITY_KEYS).map((k) => {
      const s = st(k);
      return s ? [s.state, s.attributes.options, k === 'connected' ? s.attributes : 0] : null;
    })) + JSON.stringify(Object.keys((h.services && h.services.lumagen) || {}));
    if (!force && sig === this._sig) return;
    this._sig = sig;

    const K = this._k;
    const set = (k, text) => { if (K[k] && K[k].textContent !== text) K[k].textContent = text; };
    const html = (el, markup) => { if (el && el.innerHTML !== markup) el.innerHTML = markup; };
    const power = v('power');
    const link = v('connected');
    this._powerState = power;
    const isOn = power === 'on';
    const found = !!(E.power || E.remote);
    const isDown = found && (link === 'off' || power === 'unavailable');
    // While the link is down the last-known values are stale: show them dimmed, without HDR/game tint.
    const live = isOn && !isDown;
    const isHdr = live && v('src_dr') === 'HDR';
    const isGame = live && v('game') === 'on';
    const R = this._root.classList;
    R.toggle('is-on', isOn);
    R.toggle('is-off', !isOn);
    R.toggle('is-down', isDown);
    R.toggle('is-hdr', isHdr && !isGame);
    R.toggle('is-game', isGame);

    // header
    if (K.dot) {
      const dotCls = `lmg-dot at-${K.dot.dataset.pos}` + (link === 'on' ? ' ok' : link === 'off' ? ' bad' : '');
      if (K.dot.className !== dotCls) K.dot.className = dotCls;
      const tip = link === 'on' ? 'Link OK' : link === 'off' ? 'Link down' : '';
      if (K.dot.title !== tip) K.dot.title = tip;
    }
    const summary = !found ? 'No Lumagen found — pick a device in the card editor'
      : isDown ? 'Offline'
        : !isOn ? 'Standby'
          : [v('input_label'), v('src_dr'), v('out_aspect')].filter(okState).join(' · ');
    const standby = found && !isOn && !isDown;
    const sbMode = cfg(c, 'standby_text');
    const sbButton = standby && cfg(c, 'standby_button');
    set('summary', sbButton ? '' : summary);
    K.summary.hidden = sbButton;
    K.pwr2.hidden = !sbButton;
    K.standby_inline.hidden = !(standby && sbMode === 'inline');
    K.standby.hidden = !(standby && sbMode === 'below');
    this._found = found;
    this._standbyNow = !isOn && !isDown;

    // sections on/off (config) + entity availability
    const secShown = {};
    this.querySelectorAll('[data-sec]').forEach((el) => {
      const sec = el.dataset.sec;
      let show = sec === 'source' ? cfg(c, 'show_source') && (cfg(c, 'show_inputs') || cfg(c, 'show_memory')) : cfg(c, 'show_' + sec);
      if (sec === 'remote') show = show && !!E.remote;
      if (sec === 'aspects') show = show && !!E.aspect;
      if (sec === 'source') show = show && !!(E.input || E.memory);
      if (sec === 'picture') show = show && !!(E.cms || E.style);
      if (sec === 'hdr') show = show && isHdr && okState(v('hdr_max'));
      el.hidden = !show;
      secShown[sec] = show;
    });
    // A merged section's settings show only when that section would show on its own (its entities
    // exist, HDR is playing…); a target with nothing of its own still shows for merged settings.
    this.querySelectorAll('.lmg-merged').forEach((w) => { w.hidden = !secShown[w.dataset.from]; });
    this.querySelectorAll('[data-sec]').forEach((el) => {
      if (el.hidden && sectionShown(c, el.dataset.sec) && el.querySelector(':scope > .lmg-merged:not([hidden])')) el.hidden = false;
    });

    // signal chain
    const lbl = okState(v('input_label')) ? v('input_label') : okState(v('logical_input')) ? `Input ${v('logical_input')}` : '—';
    set('s_t', lbl);
    set('s_1', fmtVideo(v('src_res'), v('src_mode'), v('src_rate')));
    const nits = isHdr && okState(v('hdr_max')) ? ` ${Math.round(Number(v('hdr_max')))} nits` : '';
    set('s_2', okState(v('src_dr')) ? v('src_dr') + nits : '—');
    const mem = okState(v('memory')) ? String(v('memory')).slice(-1) : '—';
    set('l_t', `MEM ${mem}`);
    set('l_1', okState(v('cms_label')) ? v('cms_label') : '—');
    set('l_2', okState(v('style_label')) ? v('style_label') : '—');
    set('d_t', fmtVideo(v('out_res'), v('out_mode'), v('out_rate')));
    set('d_1', okState(v('out_cs')) ? v('out_cs') : '—');
    set('d_2', okState(v('out_aspect')) ? v('out_aspect') : '—');

    // tags
    const tags = [];
    if (isDown) tags.push(['LINK DOWN', 'bad']);
    if (isHdr) tags.push(['HDR', 'hdr']);
    if (isGame) tags.push(['GAME', 'game']);
    if (live && v('nls') === 'True') tags.push(['NLS', 'ctx']);
    if (live && v('auto_aspect') === 'on') tags.push(['AUTO AR', '']);
    if (live && okState(v('src_3d')) && v('src_3d') !== 'Off') tags.push([`3D ${v('src_3d')}`, '']);
    if (live && v('video_status') === 'No Source') tags.push(['NO SOURCE', 'bad']);
    if (live && v('video_status') === 'Test Pattern') tags.push(['TEST PATTERN', '']);
    html(K.tags, tags.map(([t, cls]) => `<span class="lmg-tag ${cls}">${esc(t)}</span>`).join(''));

    // visualizer
    this._drawViz(v);

    // HDR panel
    if (isHdr && okState(v('hdr_max'))) {
      const max = Math.round(Number(v('hdr_max')));
      const min = okState(v('hdr_min')) ? Number(v('hdr_min')) : null;
      const cll = okState(v('hdr_cll')) ? Math.round(Number(v('hdr_cll'))) : 0;
      const pct = max > 0 && cll > 0 ? Math.min(100, (cll / max) * 100) : 0;
      html(K.hdr, `Mastered <b>${max} nits</b>${min !== null ? ` · min ${min}` : ''}${cll ? ` · MaxCLL <b>${cll}</b>` : ''}`
        + (cll ? `<div class="lmg-bar"><span style="width:${pct.toFixed(1)}%"></span></div>` : ''));
    }

    // chip rows
    this._chips('input', E.input, st('input'), chipLabel, 'hide_inputs');
    this._chips('memory', E.memory, st('memory'), (o) => o.replace(/^MEM/, ''), 'hide_memory');
    this._chips('aspect', E.aspect, st('aspect'), (o) => o, 'hide_aspects');
    this._chips('cms', E.cms, st('cms'));
    this._chips('style', E.style, st('style'));
    this.querySelectorAll('[data-row]').forEach((row) => {
      const optSec = row.dataset.optSec;
      row.hidden = !E[row.dataset.row] || (optSec ? !cfg(c, 'show_' + optSec) : false);
    });
    const svc = (n) => !!(h.services && h.services.lumagen && h.services.lumagen[n]);
    this.querySelectorAll('[data-a]').forEach((b) => {
      const avail = {
        nls_btn: !!E.nls_btn && !hiddenSet(c, 'hide_aspects').has('"nls"'),
        reset_aa: !!E.reset_aa && !hiddenSet(c, 'hide_aspects').has('"reset"'), restart: !!E.restart, reload: !!E.reload,
        hotplug: !!E.remote && svc('hotplug'), osd_test: !!E.remote && svc('show_osd_volume'),
        osd_clear: !!E.remote && svc('clear_osd_message'), alt: !!E.remote,
      }[b.dataset.a];
      b.hidden = !avail;
    });

    // section peeks: current value shown on the collapsed header
    const peek = (sec, text) => {
      const el = this.querySelector(`[data-peek="${sec}"]`);
      if (el && el.textContent !== text) el.textContent = text;
    };
    peek('aspects', [okState(v('aspect')) ? v('aspect') : '', live && v('auto_aspect') === 'on' ? 'auto' : '', live && v('nls') === 'True' ? 'NLS' : ''].filter(Boolean).join(' · '));
    peek('source', [okState(v('input_label')) ? v('input_label') : '', mem !== '—' ? `MEM ${mem}` : ''].filter(Boolean).join(' · '));
    peek('picture', [v('cms_label'), v('style_label')].filter(okState).join(' · '));
    peek('admin', link === 'off' ? 'link down' : '');

    // admin notes
    const ls = st('connected');
    if (ls) {
      const a = ls.attributes || {};
      const why = a.last_disconnect_reason;
      set('link', `Link ${ls.state === 'on' ? 'connected' : 'DOWN'} · ${a.reconnects || 0} reconnects · watchdog ${a.watchdog || '—'}${why ? ` · last: ${why}` : ''}`);
      const cls = 'lmg-note' + (ls.state === 'on' ? '' : ' bad');
      if (K.link.className !== cls) K.link.className = cls;
    } else {
      set('link', 'Link status needs the LTek lumagen integration (Connected sensor not found).');
    }
    const missing = Object.entries(OPTIONAL_ENTITIES).filter(([k]) => !E[k]).map(([, n]) => n);
    set('missing', missing.length ? `Disabled: ${missing.join(' · ')} — enable in Settings → Devices & services → Lumagen → device → Entities.` : '');
    K.missing.hidden = !missing.length;

    this._applyItems();
    this._applyVisibility();
  }

  _chips(name, entityId, state, label = chipLabel, hideKey = '') {
    const box = this.querySelector(`[data-opts="${name}"]`);
    if (!box) return;
    const hidden = hideKey ? hiddenSet(this._config, hideKey) : null;
    const all = (state && state.attributes && state.attributes.options) || [];
    const options = hidden ? all.filter((o) => !hidden.has(JSON.stringify(HIDE_LISTS[hideKey].id(o)))) : all;
    const sig = JSON.stringify([entityId, options]);
    if (this._optSig[name] !== sig) {
      this._optSig[name] = sig;
      const labels = options.map(label);
      const dup = new Set(labels.filter((l, i) => labels.indexOf(l) !== i));
      box.innerHTML = options.map((o, i) => `<button class="lmg-chip" data-opt="${esc(o)}" data-ent="${esc(entityId)}" title="${esc(o)}">${esc(dup.has(labels[i]) ? o : labels[i])}</button>`).join('');
    }
    const current = state ? state.state : null;
    box.querySelectorAll('[data-opt]').forEach((b) => b.classList.toggle('on', b.dataset.opt === current));
  }

  _drawViz(v) {
    const raster = parseAspect(v('src_raster')) || 1.78;
    const selected = parseAspect(v('src_content')) || raster;
    const content = parseAspect(v('det_content')) || selected; // the real picture
    const screen = Number(cfg(this._config, 'display_aspect')) || 1.78;
    const output = parseAspect(v('out_aspect')) || screen;
    const nls = v('nls') === 'True';
    const nlsVertical = Math.min(25, Math.max(0, Number(cfg(this._config, 'nls_vertical')) || 0));
    const g = vizGeometry({ raster, content, selected, output, screen, nls, nlsVertical });
    const crop = nlsCropPct(g);
    const V = this._v;
    const attrs = (el, o) => Object.entries(o).forEach(([k, val]) => {
      const s = typeof val === 'number' ? val.toFixed(2) : val;
      if (el.getAttribute(k) !== s) el.setAttribute(k, s);
    });
    const rect = (r) => ({ x: r.x, y: r.y, width: r.w, height: r.h });
    const vb = (x, y, w, h) => `${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)}`;
    // before: the incoming frame with the real picture, and the region the Lumagen uses
    attrs(V.src, { viewBox: vb(0, 0, g.source.w, g.source.h) });
    attrs(V['src-frame'], { x: 0, y: 0, width: g.source.w, height: g.source.h });
    attrs(V['src-edge'], { x: 0, y: 0, width: g.source.w, height: g.source.h });
    attrs(V['src-img'], rect(g.content));
    // the outline is what reaches the screen: the Lumagen's region, less the NLS top / bottom crop
    attrs(V['src-sel'], rect(g.visible));
    V['src-sel'].style.display = Math.abs(selected - content) > 0.01 || crop > 0.05 ? '' : 'none';
    // after: the screen; the Lumagen's output area is black, and the selected region is
    // scaled into it (uniform fit; NLS fills the width). The nested svg's viewBox clips
    // anything outside the selected region — that is the top/bottom crop.
    attrs(V.scr, { viewBox: vb(0, 0, g.screen.w, g.screen.h) });
    attrs(V['scr-wall'], { x: 0, y: 0, width: g.screen.w, height: g.screen.h });
    attrs(V['scr-area'], rect(g.area));
    attrs(V['scr-edge'], { x: 0, y: 0, width: g.screen.w, height: g.screen.h });
    attrs(V.out, { ...rect(g.picture), viewBox: vb(g.visible.x, g.visible.y, g.visible.w, g.visible.h) });
    attrs(V['out-frame'], { x: 0, y: 0, width: g.source.w, height: g.source.h });
    attrs(V['out-img'], rect(g.content));
    const before = `Content <b>${f2(content)}</b>${Math.abs(content - raster) > 0.01 ? ` in ${f2(raster)} frame` : ''}`
      + (Math.abs(selected - content) > 0.01 ? `<br>Lumagen set to ${f2(selected)}` : '')
      + (crop > 0.05 ? `<br>NLS crops ${f1(crop / 2)}% top &amp; bottom` : '');
    const after = `Content <b>${f2(selected)}</b> · Output <b>${f2(output)}</b><br>on ${f2(screen)} screen · ${vizResult({ content, selected, output, screen, nls }, g)}`;
    if (this._k.cap_before.innerHTML !== before) this._k.cap_before.innerHTML = before;
    if (this._k.cap_after.innerHTML !== after) this._k.cap_after.innerHTML = after;
  }
}

// ---------------------------------------------------------------------------
// Editor
// ---------------------------------------------------------------------------
const THEME_COLORS = [
  ['var(--primary-color)', 'Primary'],
  ['var(--accent-color)', 'Accent'],
  ['var(--primary-text-color)', 'Primary text'],
  ['var(--secondary-text-color)', 'Secondary text'],
  ['var(--disabled-text-color)', 'Disabled text'],
  ['var(--state-active-color)', 'State active'],
  ['var(--error-color)', 'Error'],
  ['var(--warning-color)', 'Warning'],
  ['var(--success-color)', 'Success'],
  ['var(--info-color)', 'Info'],
];
const CONTEXT_COLORS = [
  ['accent_color', 'Accent', 'Theme primary', '#2196f3'],
  ['hdr_color', 'HDR', 'Amber', '#ffb300'],
  ['game_color', 'Game mode', 'Green', '#4caf50'],
];
const ASPECT_PRESETS = [1.33, 1.78, 1.85, 2.0, 2.2, 2.35, 2.4];

/** Eye show/hide toggle (design system: show/hide is an eye icon, never a checkbox). */
function eyeToggle(key, on, label = '', extra = '') {
  const what = label || 'section';
  return `<button class="lmge-act lmge-eye${on ? '' : ' off'}${label ? ' lbl' : ''}" data-eye="${key}"${extra} aria-pressed="${on}"
    title="${on ? 'Hide' : 'Show'} ${esc(what)}"><ha-icon icon="${on ? 'mdi:eye-outline' : 'mdi:eye-off-outline'}"></ha-icon>${label ? `<span>${esc(label)}</span>` : ''}</button>`;
}

function colorMode(cur, allowTransparent = false) {
  cur = cur == null ? '' : String(cur);
  if (cur === '') return 'default';
  if (allowTransparent && cur === 'transparent') return 'transparent';
  if (/^#[0-9a-fA-F]{3,8}$/.test(cur)) return 'custom';
  if (/^var\(/.test(cur) && THEME_COLORS.some(([v]) => v === cur)) return 'theme';
  return 'css';
}

const EDITOR_CSS = `
        .lmge {
          /* Font sizes (by role, not by pixel) */
          --ltek-fs-panel-title: 16px;  /* top-level panel / section title */
          --ltek-fs-header: 15px;       /* editor header, panel summary */
          --ltek-fs-group: 14px;        /* group heading inside a panel */
          --ltek-fs-label: 13px;        /* standard field label / row */
          --ltek-fs-body: 12px;         /* body text, most controls */
          --ltek-fs-small: 11px;        /* hints, secondary text */
          --ltek-fs-tiny: 10px;         /* badges, micro-labels */
          /* Font weights */
          --ltek-fw-normal: 400;        /* control labels (recede) */
          --ltek-fw-medium: 500;
          --ltek-fw-semibold: 600;
          --ltek-fw-bold: 700;          /* titles, values (lead) */
          /* Text colors */
          --ltek-c-text: var(--primary-text-color, #e1e1e1);  /* primary */
          --ltek-c-label: #ccc;         /* control labels */
          --ltek-c-muted: #888;         /* hints / disabled */
          --ltek-c-accent: var(--primary-color, #2196F3);
          /* Accent tints — hover / active fills (kept as rgba literals; one place
             to change). Default to the Material blue the cards shipped with. */
          --ltek-c-accent-fade: rgba(var(--rgb-primary-color,33,150,243),0.12);       /* active / pressed fill */
          --ltek-c-accent-fade-soft: rgba(var(--rgb-primary-color,33,150,243),0.08);  /* hover fill */
          --ltek-c-error-fade: rgba(244,67,54,0.15);         /* delete hover fill */
          /* Status colors — defer to the user's theme, fall back to Material. */
          --ltek-c-error: var(--error-color, #f44336);
          --ltek-c-success: var(--success-color, #4caf50);
          --ltek-c-warning: var(--warning-color, #ffb300);
          --ltek-c-info: var(--info-color, #2196F3);
          /* Second accent: the green "library / shared" grouping (distinct from
             the blue layout accent on purpose — NOT tied to --primary-color). */
          --ltek-c-accent-lib: #7fd18a;
          --ltek-c-on-accent: #fff;   /* text/icon on a solid accent fill */
          /* Action icons (edit/copy/hide/etc): neutral idle → brighten on hover.
             Delete stays a status color (error) on its own hover. */
          --ltek-c-icon: #aaa;        /* idle action icon */
          --ltek-c-icon-hover: #fff;  /* hovered action icon */
          /* Surfaces */
          --ltek-c-surface: rgba(255,255,255,0.015);        /* panels */
          --ltek-c-surface-raised: rgba(255,255,255,0.02);  /* cards / rows */
          /* Borders */
          --ltek-c-panel-border: #3a3a3a;   /* panels */
          --ltek-c-border: #444;            /* controls */
          --ltek-c-border-soft: #333;       /* subtle inner dividers */
          /* Radii */
          --ltek-r-panel: 12px;   /* panels */
          --ltek-r-card: 10px;    /* section cards */
          --ltek-r-md: 8px;       /* blocks */
          --ltek-r-ctrl: 6px;     /* inputs, selects, buttons */
          /* Spacing scale (4px base) */
          --ltek-sp-1: 4px;
          --ltek-sp-2: 6px;
          --ltek-sp-3: 8px;
          --ltek-sp-4: 10px;
          --ltek-sp-5: 12px;
          --ltek-sp-6: 16px;
          /* Control padding — uniform input/select/button height. */
          --ltek-ctrl-pad: 6px 10px;
          /* Icon sizes (two clear roles; one-off glyphs stay literal). */
          --ltek-icon-sm: 16px;   /* inline / action icons */
          --ltek-icon-lg: 20px;   /* panel-title icons */
          /* Slider row geometry (shared by every slider) */
          --ltek-slider-val-w: 44px;   /* value readout column width */
          display: flex; flex-direction: column; gap: 8px; font-family: var(--paper-font-body1_-_font-family, sans-serif);
        }
        .lmge ha-icon { --mdc-icon-size: 18px; vertical-align: middle; }
        .lmge-sec { border: 1px solid var(--ltek-c-panel-border); border-radius: var(--ltek-r-panel); background: var(--ltek-c-surface); overflow: hidden; }
        .lmge-sec[open] { border-color: var(--ltek-c-accent); }
        .lmge-sec > summary { display: flex; align-items: center; gap: var(--ltek-sp-3); padding: 14px 16px; cursor: pointer; user-select: none;
          list-style: none; font-size: var(--ltek-fs-panel-title); font-weight: var(--ltek-fw-bold); color: var(--ltek-c-text); }
        .lmge-sec > summary::-webkit-details-marker, .lmge-sub > summary::-webkit-details-marker { display: none; }
        .lmge-sec > summary > ha-icon:not(.chev) { color: var(--ltek-c-accent); --mdc-icon-size: var(--ltek-icon-lg); }
        .lmge-sec > summary .chev, .lmge-sub > summary .chev { margin-left: auto; color: #999; --mdc-icon-size: 20px; transition: transform .2s ease; transform: rotate(-90deg); }
        .lmge-sec[open] > summary .chev, .lmge-sub[open] > summary .chev { transform: none; }
        .lmge-body { padding: 0 16px 16px; }
        .lmge-hint { color: var(--ltek-c-muted); font-size: var(--ltek-fs-small); margin: 0 0 var(--ltek-sp-3); }
        .lmge-group { color: var(--accent-color, var(--ltek-c-accent)); font-size: var(--ltek-fs-group); font-weight: var(--ltek-fw-semibold);
          margin-top: var(--ltek-sp-4); padding-top: var(--ltek-sp-3); border-top: 1px solid var(--ltek-c-border-soft); }
        .lmge-group.first { margin-top: 0; padding-top: 0; border-top: none; }
        .lmge-sub { border-top: 1px solid var(--ltek-c-border-soft); border-radius: var(--ltek-r-ctrl); }
        .lmge-sub + .lmge-sub { margin-top: 0; }
        .lmge-sub[open] { border: 1px solid var(--accent-color, var(--ltek-c-accent)); margin: var(--ltek-sp-1) 0; }
        .lmge-sub > summary { display: flex; align-items: center; gap: var(--ltek-sp-2); padding: var(--ltek-sp-3) var(--ltek-sp-2); cursor: pointer;
          list-style: none; color: var(--ltek-c-accent); font-size: var(--ltek-fs-label); font-weight: var(--ltek-fw-semibold);
          text-transform: uppercase; letter-spacing: 0.04em; }
        .lmge-sub-body { padding: 0 var(--ltek-sp-4) var(--ltek-sp-4); }
        .lmge-row { display: flex; align-items: center; gap: var(--ltek-sp-4); padding: var(--ltek-sp-1) 0; flex-wrap: wrap; justify-content: flex-start; }
        .lmge-row label.lbl { color: var(--ltek-c-label); font-size: var(--ltek-fs-body); font-weight: var(--ltek-fw-normal); flex: none; }
        .lmge-row input[type="text"], .lmge-row select { flex: 1 1 auto; min-width: 0; padding: var(--ltek-ctrl-pad);
          background: var(--secondary-background-color, #2a2a2a); border: 1px solid var(--ltek-c-border); border-radius: var(--ltek-r-ctrl);
          color: var(--ltek-c-text); font-size: var(--ltek-fs-body); }
        .lmge-row ha-icon-picker { flex: 1 1 auto; min-width: 0; }
        .lmge-row input[type="range"] { flex: 1 1 auto; min-width: 100px; accent-color: var(--ltek-c-accent); cursor: pointer; }
        .lmge-val { flex: 0 0 var(--ltek-slider-val-w); text-align: right; font-weight: var(--ltek-fw-bold); font-variant-numeric: tabular-nums;
          white-space: nowrap; color: var(--ltek-c-text); font-size: var(--ltek-fs-body); }
        .lmge-nowrap { flex-wrap: nowrap; }
        .lmge-check { display: flex; align-items: center; gap: var(--ltek-sp-2); padding: var(--ltek-sp-1) 0; color: var(--ltek-c-label);
          font-size: var(--ltek-fs-body); cursor: pointer; }
        .lmge-check input { accent-color: var(--ltek-c-accent); }
        .lmge-color { display: flex; flex: 1 1 auto; gap: var(--ltek-sp-2); flex-wrap: wrap; min-width: 0; }
        .lmge-color select.lmge-cmode { flex: 0 0 auto; min-width: 120px; }
        .lmge-color input[type="color"] { flex: 0 0 auto; width: 44px; height: 30px; padding: 0; border: none; background: none; cursor: pointer; }
        .lmge-presets { display: flex; flex-wrap: wrap; gap: var(--ltek-sp-1); }
        .lmge-preset { padding: 3px 8px; border: 1px solid var(--ltek-c-border); border-radius: var(--ltek-r-ctrl); background: transparent;
          color: var(--ltek-c-text); font-size: var(--ltek-fs-small); cursor: pointer; }
        .lmge-preset:hover { border-color: var(--ltek-c-accent); background: var(--ltek-c-accent-fade-soft); }
        .lmge-preset.on { border-color: var(--ltek-c-accent); background: var(--ltek-c-accent-fade); color: var(--ltek-c-accent); }
        .lmge-slist { display: flex; flex-direction: column; gap: var(--ltek-sp-2); }
        .lmge-srow { display: flex; align-items: center; gap: var(--ltek-sp-2); padding: 6px 8px; border-radius: var(--ltek-r-card);
          background: var(--ltek-c-surface-raised); border: 1px solid var(--ltek-c-border-soft); }
        .lmge-srow.off .lmge-sname, .lmge-srow.off .lmge-sicon { opacity: .45; }
        .lmge-sicon { flex: 0 0 auto; color: var(--ltek-c-accent); --mdc-icon-size: 20px; }
        .lmge-sname { flex: 1 1 auto; min-width: 0; color: var(--ltek-c-text); font-size: var(--ltek-fs-label); font-weight: var(--ltek-fw-normal);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .lmge-sctl { display: flex; gap: var(--ltek-sp-3); flex: 0 0 auto; }
        .lmge-eye.off { color: var(--ltek-c-muted); }
        .lmge-eye.lbl { gap: var(--ltek-sp-1); align-items: center; font-size: var(--ltek-fs-small); color: var(--ltek-c-label); }
        .lmge-eye.lbl.off { color: var(--ltek-c-muted); }
        .lmge-eye.lbl.off span { text-decoration: line-through; }
        .lmge-blist { display: flex; flex-direction: column; }
        .lmge-brow { display: flex; align-items: center; gap: var(--ltek-sp-2); padding: var(--ltek-sp-1) var(--ltek-sp-1);
          border-top: 1px solid var(--ltek-c-border-soft); }
        .lmge-brow:first-child { border-top: none; }
        .lmge-brow.off .lmge-sname { color: var(--ltek-c-muted); }
        .lmge-act.on { color: var(--ltek-c-accent); }
        .lmge-warn { color: var(--warning-color, #ff9800); }
        .lmge-stag { flex: 0 0 auto; font-size: var(--ltek-fs-small); color: var(--ltek-c-muted); white-space: nowrap; }
        .lmge-sedit { margin: calc(-1 * var(--ltek-sp-1)) 0 var(--ltek-sp-1) 28px; padding: var(--ltek-sp-2) var(--ltek-sp-3);
          border: 1px solid var(--ltek-c-accent); border-radius: var(--ltek-r-card); background: var(--ltek-c-surface); }
        .lmge-act { border: none; background: none; padding: 0; color: var(--ltek-c-icon); cursor: pointer; display: flex; }
        .lmge-act:hover:not([disabled]) { color: var(--ltek-c-icon-hover); }
        .lmge-act[disabled] { opacity: .25; cursor: default; }
        .lmge-act ha-icon { --mdc-icon-size: var(--ltek-icon-sm); }
        .lmge-btn { padding: var(--ltek-ctrl-pad); border: 1px solid var(--ltek-c-accent); border-radius: var(--ltek-r-ctrl); background: transparent;
          color: var(--ltek-c-accent); font-size: var(--ltek-fs-body); cursor: pointer; }
        .lmge-btn:hover { background: var(--ltek-c-accent-fade-soft); }
        .lmge-reset { border: none; background: none; padding: 0; color: var(--ltek-c-icon); cursor: pointer; }
        .lmge-reset:hover { color: var(--ltek-c-icon-hover); }
        .lmge-reset ha-icon { --mdc-icon-size: var(--ltek-icon-sm); }
        .lmge-foot { color: var(--ltek-c-muted); font-size: var(--ltek-fs-tiny); text-align: right; }
`;

class LumagenCardEditor extends HTMLElement {
  constructor() {
    super();
    this._config = {};
    this._open = new Set(['card']);
    this._rendered = false;
    this._cmode = {}; // color key -> mode picked in this session (so an empty Custom CSS field stays visible)
  }

  setConfig(config) {
    const next = normalizeConfig(config);
    const changed = JSON.stringify(next) !== JSON.stringify(this._config);
    this._config = next;
    if (this._hass && (!this._rendered || changed)) this._render();
  }

  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    if (first || !this._rendered) this._render();
  }

  _emit() {
    this._config = normalizeConfig(this._config);
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this._config }, bubbles: true, composed: true }));
  }

  /** Write a config value. scope: '' (top level) | 'styles' | 'icons'. Defaults / empty remove the key. */
  _set(key, value, scope = '') {
    if (!scope) {
      if (value === '' || value === undefined || value === null || value === DEFAULTS[key]) delete this._config[key];
      else this._config[key] = value;
    } else {
      const obj = { ...(this._config[scope] || {}) };
      if (value === '' || value === undefined || value === null) delete obj[key];
      else obj[key] = value;
      if (Object.keys(obj).length) this._config[scope] = obj; else delete this._config[scope];
    }
    this._emit();
  }

  _get(key, scope = '') {
    return scope ? (this._config[scope] || {})[key] : this._config[key];
  }

  _panel(id, icon, title, body) {
    return `<details class="lmge-sec" data-panel="${id}"${this._open.has(id) ? ' open' : ''}>
      <summary><ha-icon icon="${icon}"></ha-icon>${title}<ha-icon class="chev" icon="mdi:chevron-down"></ha-icon></summary>
      <div class="lmge-body">${body}</div></details>`;
  }

  _sub(id, title, body) {
    return `<details class="lmge-sub" data-panel="${id}"${this._open.has(id) ? ' open' : ''}>
      <summary>${title}<ha-icon class="chev" icon="mdi:chevron-down"></ha-icon></summary>
      <div class="lmge-sub-body">${body}</div></details>`;
  }

  _colorControl(key, label, defaultLabel, seedHex, scope = '') {
    const cur = this._get(key, scope) || '';
    const id = `${scope}:${key}`;
    // The mode picked in this editor session wins (e.g. Custom CSS holding a listed theme var);
    // otherwise classify the stored value.
    const canClear = scope === 'styles' && TRANSPARENT_KEYS.has(key);
    const mode = this._cmode[id] || (cur ? colorMode(cur, canClear) : 'default');
    const data = `data-ckey="${key}" data-scope="${scope}"`;
    let field = '';
    if (mode === 'theme') {
      field = `<select class="lmge-ctheme" ${data}>${THEME_COLORS.map(([v, n]) => `<option value="${v}"${v === cur ? ' selected' : ''}>${n}</option>`).join('')}</select>`;
    } else if (mode === 'custom') {
      const hex = /^#[0-9a-fA-F]{6}$/.test(cur) ? cur : seedHex;
      field = `<input type="color" class="lmge-chex" ${data} value="${hex}">`;
    } else if (mode === 'css') {
      field = `<input type="text" class="lmge-ccss" ${data} value="${esc(cur)}" placeholder="e.g. tomato, rgba(…), var(--my-color)">`;
    }
    const modes = [['default', defaultLabel], ...(canClear ? [['transparent', 'Transparent']] : []),
      ['theme', 'Theme color'], ['custom', 'Custom color'], ['css', 'Custom CSS']];
    return `<div class="lmge-row"><label class="lbl">${label}</label><div class="lmge-color">
      <select class="lmge-cmode" ${data} data-seed="${seedHex}">${modes.map(([m, n]) => `<option value="${m}"${m === mode ? ' selected' : ''}>${n}</option>`).join('')}</select>
      ${field}</div></div>`;
  }

  _slider(key, label, value, min, max, step, scope = '', fmt = (n) => `${n}px`) {
    const isSet = this._get(key, scope) !== undefined;
    return `<div class="lmge-row lmge-nowrap"><label class="lbl">${label}</label>
      <input type="range" data-skey="${key}" data-scope="${scope}" min="${min}" max="${max}" step="${step}" value="${value}">
      <span class="lmge-val" data-val="${scope}:${key}">${fmt(value)}</span>
      ${isSet && scope ? `<button class="lmge-reset" data-reset="${key}" data-scope="${scope}" title="Back to default"><ha-icon icon="mdi:restore"></ha-icon></button>` : ''}</div>`;
  }

  /** The inline panel under a section row (pencil): name, its settings' eyes, merge. */
  _secEditPanel(id) {
    const c = this._config;
    const items = SECTION_ITEMS[id] || [];
    const hidden = new Set(c.hidden_items || []);
    const m = c.section_merge || {};
    const isTarget = Object.keys(m).some((k) => k !== id && m[k] === id);
    const rows = items.map(([iid, label, , key]) => {
      const on = key ? !!cfg(c, key) : !hidden.has(`${id}.${iid}`);
      const attr = key ? `data-eye="${key}"` : `data-item-eye="${id}.${iid}"`;
      return `<div class="lmge-brow${on ? '' : ' off'}"><span class="lmge-sname">${esc(label)}</span>${eyeToggle('', on, '', ' ' + attr).replace(' data-eye=""', '')}</div>`;
    }).join('');
    const targets = MERGE_TARGETS.filter((t) => t !== id && !m[t]);
    const cur = m[id] || '';
    let merge;
    if (NOT_MERGEABLE.includes(id)) merge = '<p class="lmge-hint">This section can\'t be shown inside another one.</p>';
    else if (isTarget) merge = '<p class="lmge-hint">Other sections are shown inside this one, so it stays a section of its own.</p>';
    else {
      merge = `<div class="lmge-row"><label class="lbl">Show its settings in</label>
        <select data-smerge="${id}"><option value="">— its own section —</option>${targets.map((t) => `<option value="${t}"${t === cur ? ' selected' : ''}>${esc(secLabel(c, t))}</option>`).join('')}</select></div>
        ${cur && ALWAYS_SHOWN.includes(cur) ? `<p class="lmge-hint lmge-warn">${esc(secLabel(c, cur))} is always visible, not a collapsed section, so these settings can be changed by a stray tap.</p>` : ''}
        <p class="lmge-hint">The section itself disappears from the card; its visible settings appear at the end of the chosen section, under this section's name.${cur && !mergeTarget(c, id) ? ' <b>Not applied now:</b> one of the two sections is hidden.' : ''}</p>`;
    }
    return `<div class="lmge-sedit" data-sedit-panel="${id}">
      <div class="lmge-row"><label class="lbl">Name</label><input type="text" data-sname="${id}" value="${esc((c.section_names || {})[id] || '')}" placeholder="${esc(defaultSectionName(id))}"></div>
      ${this._secOptions(id)}
      <div class="lmge-group">Settings</div>
      ${items.length ? `<div class="lmge-blist">${rows}</div>` : '<p class="lmge-hint">This section is a single block; use its eye to show or hide it.</p>'}
      <div class="lmge-group">Merge</div>
      ${merge}
    </div>`;
  }

  /** Section-specific options shown in its edit panel. */
  _secOptions() { return ''; }

  /** Pencil button for a section row. */
  _secEditBtn(id) {
    const open = this._sedit === id;
    return `<button class="lmge-act${open ? ' on' : ''}" data-sedit="${id}" aria-expanded="${open}" title="${open ? 'Close' : 'Edit section'}"><ha-icon icon="mdi:pencil-outline"></ha-icon></button>`;
  }

  /** Tag on a merged section's row: where its settings show. */
  _secMergeTag(id) {
    const t = mergeTarget(this._config, id);
    return t ? `<span class="lmge-stag" title="Shown inside ${esc(secLabel(this._config, t))}">→ ${esc(secLabel(this._config, t))}</span>` : '';
  }

  _sectionList() {
    const c = this._config;
    const order = normalizeOrder(c.section_order);
    const custom = !!c.section_order;
    const rows = order.map((id, i) => {
      const [, name, icon, keys] = SECTIONS.find((x) => x[0] === id);
      const ic = icon.startsWith('icon:') ? iconFor(c, icon.slice(5)) : icon;
      const shown = cfg(c, keys[0]);
      return `<div class="lmge-srow${shown ? '' : ' off'}" data-sid="${id}">
        <ha-icon class="lmge-sicon" icon="${esc(ic)}"></ha-icon>
        <span class="lmge-sname">${esc(secLabel(c, id))}</span>${this._secMergeTag(id)}
        <button class="lmge-act" data-move="-1" data-sid="${id}" title="Move up"${i === 0 ? ' disabled' : ''}><ha-icon icon="mdi:arrow-up"></ha-icon></button>
        <button class="lmge-act" data-move="1" data-sid="${id}" title="Move down"${i === order.length - 1 ? ' disabled' : ''}><ha-icon icon="mdi:arrow-down"></ha-icon></button>
        ${eyeToggle(keys[0], shown)}
        ${this._secEditBtn(id)}
      </div>${this._sedit === id ? this._secEditPanel(id) : ''}`;
    }).join('');
    return `<div class="lmge-slist">${rows}</div>
      ${custom ? '<div class="lmge-row"><button class="lmge-btn" data-order-reset>Reset to default order</button></div>' : ''}`;
  }

  _buttonsBody() {
    const c = this._config;
    const E = resolveEntities(this._hass, cfg(c, 'device'));
    const group = (title, key, labelFn) => {
      const def = HIDE_LISTS[key];
      const s = E[def.entity] && this._hass.states[E[def.entity]];
      const opts = (s && s.attributes && s.attributes.options) || [];
      const hidden = hiddenSet(c, key);
      const items = [...opts.map((o) => [def.id(o), labelFn(o)]), ...(def.extra || [])];
      const body = items.length
        ? `<div class="lmge-blist">${items.map(([val, label]) => {
          const on = !hidden.has(JSON.stringify(val));
          return `<div class="lmge-brow${on ? '' : ' off'}"><span class="lmge-sname">${esc(label)}</span>
            ${eyeToggle('', on, '', ` data-hide="${key}" data-hval='${esc(JSON.stringify(val))}'`).replace(' data-eye=""', '')}</div>`;
        }).join('')}</div>`
        : '<p class="lmge-hint">Not available — the entity is missing or the Lumagen is not connected.</p>';
      return this._sub(`btn-${key}`, title, body);
    };
    return `<p class="lmge-hint">Use the eye to hide a button from the card. The lists come from your Lumagen (labels) and the integration's aspect ratio menu.</p>
      ${group('Aspect', 'hide_aspects', (o) => o)}
      ${group('Input', 'hide_inputs', (o) => chipLabel(o))}
      ${group('Memory', 'hide_memory', (o) => String(o).replace(/^MEM/, 'Memory '))}`;
  }

  _render() {
    if (!this._hass) return;
    const c = this._config;
    const devices = listDevices(this._hass);
    const dev = cfg(c, 'device');
    const aspect = Number(cfg(c, 'display_aspect'));
    const st = c.styles || {};
    const deviceBody = `
      <p class="lmge-hint">Which Lumagen to show. Entities are found automatically, so renamed entity IDs keep working.</p>
      <div class="lmge-row"><label class="lbl">Device</label>
        <select data-key="device">
          <option value="">${devices.length ? 'Auto (first Lumagen found)' : 'No Lumagen device found'}</option>
          ${devices.map((d) => `<option value="${esc(d.id)}"${d.id === dev ? ' selected' : ''}>${esc(d.name)}</option>`).join('')}
          ${dev && !devices.some((d) => d.id === dev) ? `<option value="${esc(dev)}" selected>${esc(dev)} (not found)</option>` : ''}
        </select></div>`;
    const sbMode = cfg(c, 'standby_text');
    const cardBody = `
      <p class="lmge-hint">The device, the header title, the power button, what the card does while the Lumagen is off, and collapsing.</p>
      <div class="lmge-group">Device</div>
      ${deviceBody}
      <div class="lmge-group">Header</div>
      <div class="lmge-row"><label class="lbl">Title</label><input type="text" data-key="title" value="${esc(cfg(c, 'title'))}"></div>
      <div class="lmge-group">Power & standby</div>
      <p class="lmge-hint">The header icon is the power button. Standby always needs a press-and-hold.</p>
      <label class="lmge-check"><input type="checkbox" data-key="power_hold_on"${cfg(c, 'power_hold_on') ? ' checked' : ''}>
        Require a hold to turn on too</label>
      <div class="lmge-row"><label class="lbl">When in standby or off</label>
        <select data-key="when_off">${WHEN_OFF.map(([v, n]) => `<option value="${v}"${v === cfg(c, 'when_off') ? ' selected' : ''}>${n}</option>`).join('')}</select></div>
      <p class="lmge-hint">The card editor always shows the card expanded, so every section can be set up.</p>
      ${cfg(c, 'when_off') !== 'hide' ? `
      <div class="lmge-row"><label class="lbl">Standby message</label>
        <select data-key="standby_text">${STANDBY_TEXT.map(([v, n]) => `<option value="${v}"${v === sbMode ? ' selected' : ''}>${n}</option>`).join('')}</select></div>
      ${sbMode !== 'hidden' ? `
      <div class="lmge-row"><label class="lbl">Message text</label><input type="text" data-key="standby_message" value="${esc(cfg(c, 'standby_message'))}"
        placeholder="Standby · ${cfg(c, 'power_hold_on') ? 'hold' : 'tap'} the icon to power on"></div>
      ${this._slider('standby_indent', 'Message indent', st.standby_indent !== undefined ? st.standby_indent : 46, 0, 160, 1, 'styles')}` : ''}
      <label class="lmge-check"><input type="checkbox" data-key="standby_button"${cfg(c, 'standby_button') ? ' checked' : ''}>
        In standby, show a power button on the right instead of the word "Standby"</label>` : ''}
      <div class="lmge-group">Link dot</div>
      <p class="lmge-hint">Green when the Lumagen answers, red when the link is down.</p>
      <div class="lmge-row"><label class="lmge-check"><input type="checkbox" data-key="show_dot"${cfg(c, 'show_dot') ? ' checked' : ''}>Show</label>
        ${cfg(c, 'show_dot') ? `<select data-key="dot_position">${DOT_POSITIONS.map(([v, n]) => `<option value="${v}"${v === cfg(c, 'dot_position') ? ' selected' : ''}>${n}</option>`).join('')}</select>` : ''}</div>
      <div class="lmge-group">Collapse</div>
      <label class="lmge-check"><input type="checkbox" data-key="collapsible"${cfg(c, 'collapsible') ? ' checked' : ''}>
        Tap the header to collapse the card to just the header (while the Lumagen is on)</label>
      ${cfg(c, 'collapsible') ? `<label class="lmge-check"><input type="checkbox" data-key="start_collapsed"${cfg(c, 'start_collapsed') ? ' checked' : ''}>
        Start collapsed</label>` : ''}`;
    const sectionsBody = `
      <p class="lmge-hint">Order and show/hide the parts of the card. Controls always live in collapsible sections so nothing changes by accident; sections for entities that are disabled in the integration hide themselves.</p>
      <p class="lmge-hint">Use the <b>pencil</b> on a section to rename it, hide single settings, or show its settings inside another section.</p>
      ${this._sectionList()}`;
    const screenBody = `
      <p class="lmge-hint">Your screen, for the visualizer and the third box of the signal chain. The visualizer crops and stretches a picture exactly as the Lumagen does with its current settings.</p>
      <div class="lmge-row"><label class="lbl">Display name</label><input type="text" data-key="display_name" value="${esc(cfg(c, 'display_name'))}"></div>
      <div class="lmge-group">Screen shape</div>
      ${this._slider('display_aspect', 'Aspect', aspect, 1.33, 2.76, 0.01, '', (n) => Number(n).toFixed(2))}
      <div class="lmge-presets">${ASPECT_PRESETS.map((p) => `<button class="lmge-preset${Math.abs(p - aspect) < 0.005 ? ' on' : ''}" data-preset="${p}">${p.toFixed(2)}</button>`).join('')}</div>
      <div class="lmge-group">Visualizer</div>
      ${this._slider('nls_vertical', 'NLS vertical stretch', Math.min(25, Math.max(0, Number(cfg(c, 'nls_vertical')))), 0, 25, 1, '', (n) => `${n}%`)}
      <p class="lmge-hint">With NLS on (a 16:9 picture on a wider screen), part of the widening is a small vertical stretch that crops the top and bottom. Set this to the vertical stretch in your Lumagen's NLS settings so the visualizer crops the same.</p>
      <label class="lmge-check"><input type="checkbox" data-key="viz_after_only"${cfg(c, 'viz_after_only') ? ' checked' : ''}>
        Only show the screen (result) and its description</label>
      <div class="lmge-row"><label class="lbl">Picture</label><input type="text" data-key="scene_image" value="${esc(cfg(c, 'scene_image'))}" placeholder="Built-in landscape — or a URL, e.g. /local/beach.jpg"></div>`;
    const iconBody = `
      <p class="lmge-hint">Any Material Design icon — type just the name (e.g. <b>movie-open</b>); "mdi:" is added for you. Leave empty for the default.</p>
      ${Object.keys(ICON_DEFAULTS).map((k) => `
        <div class="lmge-row"><label class="lbl">${ICON_LABELS[k]}</label>
          <ha-icon icon="${esc(iconFor(c, k))}"></ha-icon>
          <input type="text" data-icon="${k}" value="${esc(((c.icons || {})[k] || '').replace(/^mdi:/, ''))}" placeholder="${ICON_DEFAULTS[k].replace(/^mdi:/, '')}"></div>`).join('')}`;
    const looks = STYLE_GROUPS.map(([g, title, hint]) => this._sub(`look-${g}`, title, `
      <p class="lmge-hint">${hint}</p>
      ${STYLE_DEFS.filter((d) => d[1] === g).map(([key, , kind, label, def, min, max]) => (kind === 'size'
        ? this._slider(key, label, st[key] !== undefined ? st[key] : def, min, max, 1, 'styles')
        : this._colorControl(key, label, def, '#2196f3', 'styles'))).join('')}`)).join('')
      + this._sub('look-context', 'Context colors', `
      <p class="lmge-hint">The card tints itself by context: the accent normally, the HDR color while HDR plays, the game color in game mode.</p>
      ${CONTEXT_COLORS.map(([k, l, d, seed]) => this._colorControl(k, l, d, seed)).join('')}`);
    this.innerHTML = `<style>${EDITOR_CSS}</style>
      <div class="lmge">
        ${this._panel('card', 'mdi:card-text-outline', 'Card', cardBody)}
        ${this._panel('sections', 'mdi:view-agenda-outline', 'Sections', sectionsBody)}
        ${this._panel('screen', 'mdi:projector-screen-outline', 'Screen & visualizer', screenBody)}
        ${this._panel('buttons', 'mdi:gesture-tap-button', 'Buttons', this._buttonsBody())}
        ${this._panel('icons', 'mdi:emoticon-outline', 'Icons', iconBody)}
        ${this._panel('look', 'mdi:palette', 'Appearance', `<p class="lmge-hint">Sizes and colors. Every color can follow your theme or be custom; "Back to default" (↺) resets a size.</p>${looks}`)}
        <div class="lmge-foot">Lumagen Card ${BUILD_NUMBER}</div>
      </div>`;
    this._rendered = true;
    this._wire();
  }

  _wire() {
    this.querySelectorAll('details.lmge-sec, details.lmge-sub').forEach((d) => d.addEventListener('toggle', () => {
      if (d.open) this._open.add(d.dataset.panel); else this._open.delete(d.dataset.panel);
    }));
    this.querySelectorAll('[data-key]').forEach((el) => {
      const key = el.dataset.key;
      const reveals = ['when_off', 'collapsible', 'show_dot', 'standby_text', 'power_hold_on'].includes(key) || key.startsWith('show_');
      if (el.type === 'checkbox') el.addEventListener('change', () => { this._set(key, el.checked); if (reveals) this._render(); });
      else el.addEventListener('change', () => { this._set(key, el.value.trim()); if (reveals) this._render(); });
    });
    this.querySelectorAll('[data-skey]').forEach((el) => {
      const key = el.dataset.skey;
      const scope = el.dataset.scope;
      const fmt = scope ? (n) => `${n}px` : key === 'nls_vertical' ? (n) => `${n}%` : (n) => Number(n).toFixed(2);
      el.addEventListener('input', () => {
        const out = this.querySelector(`[data-val="${scope}:${key}"]`);
        if (out) out.textContent = fmt(el.value);
      });
      el.addEventListener('change', () => {
        const n = Number(el.value);
        if (scope) {
          const def = STYLE_INDEX[key];
          this._set(key, def && n === def[4] ? '' : n, scope);
        } else this._set(key, n);
        this._render();
      });
    });
    this.querySelectorAll('[data-move]').forEach((b) => b.addEventListener('click', () => {
      const order = normalizeOrder(this._config.section_order);
      const i = order.indexOf(b.dataset.sid);
      const j = i + Number(b.dataset.move);
      if (i < 0 || j < 0 || j >= order.length) return;
      [order[i], order[j]] = [order[j], order[i]];
      this._config.section_order = order;
      this._emit();
      this._render();
    }));
    this.querySelectorAll('[data-order-reset]').forEach((b) => b.addEventListener('click', () => {
      delete this._config.section_order;
      this._emit();
      this._render();
    }));
    this.querySelectorAll('[data-sedit]').forEach((b) => b.addEventListener('click', () => {
      this._sedit = this._sedit === b.dataset.sedit ? '' : b.dataset.sedit;
      this._render();
    }));
    this.querySelectorAll('[data-sname]').forEach((el) => el.addEventListener('change', () => {
      const names = { ...(this._config.section_names || {}) };
      const v = el.value.trim();
      if (v) names[el.dataset.sname] = v; else delete names[el.dataset.sname];
      this._config.section_names = names;
      this._emit();
      this._render();
    }));
    this.querySelectorAll('[data-item-eye]').forEach((b) => b.addEventListener('click', () => {
      const id = b.dataset.itemEye;
      const was = (this._config.hidden_items || []).includes(id);
      const list = (this._config.hidden_items || []).filter((x) => x !== id);
      if (!was) list.push(id);
      this._config.hidden_items = list;
      this._emit();
      this._render();
    }));
    this.querySelectorAll('[data-smerge]').forEach((el) => el.addEventListener('change', () => {
      const m = { ...(this._config.section_merge || {}) };
      if (el.value) m[el.dataset.smerge] = el.value; else delete m[el.dataset.smerge];
      this._config.section_merge = m;
      this._emit();
      this._render();
    }));
    this.querySelectorAll('[data-eye]').forEach((b) => b.addEventListener('click', () => {
      const key = b.dataset.eye;
      this._set(key, !cfg(this._config, key));
      this._render();
    }));
    this.querySelectorAll('[data-hide]').forEach((b) => b.addEventListener('click', () => {
      const key = b.dataset.hide;
      const val = JSON.parse(b.dataset.hval);
      const was = (this._config[key] || []);
      const isHidden = was.some((v) => JSON.stringify(v) === JSON.stringify(val));
      const list = was.filter((v) => JSON.stringify(v) !== JSON.stringify(val));
      if (!isHidden) list.push(val);
      if (list.length) this._config[key] = list; else delete this._config[key];
      this._emit();
      this._render();
    }));
    this.querySelectorAll('[data-reset]').forEach((b) => b.addEventListener('click', () => {
      this._set(b.dataset.reset, '', b.dataset.scope);
      this._render();
    }));
    this.querySelectorAll('[data-preset]').forEach((b) => b.addEventListener('click', () => {
      this._set('display_aspect', Number(b.dataset.preset));
      this._render();
    }));
    this.querySelectorAll('[data-icon]').forEach((el) => el.addEventListener('change', () => {
      this._set(el.dataset.icon, normalizeIcon(el.value) === ICON_DEFAULTS[el.dataset.icon] ? '' : normalizeIcon(el.value), 'icons');
      this._render();
    }));
    this.querySelectorAll('.lmge-cmode').forEach((sel) => sel.addEventListener('change', () => {
      const key = sel.dataset.ckey;
      const scope = sel.dataset.scope;
      const cur = this._get(key, scope) || '';
      const was = cur ? colorMode(cur) : 'default';
      let next = '';
      // Seed the new mode from the old value; never drop the user's color on a mode change.
      if (sel.value === 'transparent') next = 'transparent';
      else if (sel.value === 'theme') next = was === 'theme' ? cur : 'var(--primary-color)';
      else if (sel.value === 'custom') next = /^#[0-9a-fA-F]{6}$/.test(cur) ? cur : sel.dataset.seed;
      else if (sel.value === 'css') next = cur === 'transparent' ? '' : cur;
      this._cmode[`${scope}:${key}`] = sel.value;
      this._set(key, next, scope);
      this._render();
    }));
    const val = (sel, fn) => this.querySelectorAll(sel).forEach((el) => el.addEventListener(fn === 'input' ? 'input' : 'change',
      () => this._set(el.dataset.ckey, el.value.trim(), el.dataset.scope)));
    val('.lmge-ctheme', 'change');
    val('.lmge-chex', 'input');
    val('.lmge-ccss', 'change');
  }
}

// Test hooks (pure helpers; no effect in the browser)
LumagenCard._test = {
  BUILD_NUMBER, CARD_CSS, EDITOR_CSS, DEFAULTS, ENTITY_KEYS, OPTIONAL_ENTITIES, STYLE_DEFS, ICON_DEFAULTS, SCENE_URL,
  WHEN_OFF, SECTION_ITEMS, MERGE_TARGETS, mergeTarget, secLabel, normalizeConfig, normalizeIcon, normalizeOrder, SECTION_IDS, rootStyleVars, rootClasses, resolveEntities, listDevices, parseAspect, fitRect, vizGeometry, vizResult, nlsCropPct, fmtVideo, chipLabel, colorMode,
};

if (!customElements.get(CARD_TAG)) customElements.define(CARD_TAG, LumagenCard);
if (!customElements.get(EDITOR_TAG)) customElements.define(EDITOR_TAG, LumagenCardEditor);

window.customCards = window.customCards || [];
if (!window.customCards.some((c) => c.type === CARD_TAG)) {
  window.customCards.push({
    type: CARD_TAG,
    name: 'Lumagen Card',
    description: 'Lumagen Radiance Pro: signal chain, aspect visualizer, HDR details, and collapsible aspect, remote, source, picture and admin controls.',
    preview: false,
    documentationURL: 'https://github.com/Ltek/lumagen-card',
  });
}

console.info(`%c LUMAGEN-CARD %c ${BUILD_NUMBER} `, 'color:#fff;background:#2196F3;font-weight:700', 'color:#2196F3;background:transparent');
