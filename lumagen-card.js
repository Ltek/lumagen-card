// Lumagen Card — Home Assistant Dashboard card for the Lumagen Radiance Pro
// Version: v2026.10.12.1
//
// Signal chain (source → Lumagen → display), an aspect visualizer drawn from the
// live ratios, HDR details, one-tap chips for input / memory / aspect / CMS /
// style, a menu remote and an admin drawer — for the `lumagen` integration
// (github.com/Ltek/lumagen; the base features also work with jaysoffian/ha-lumagen).
//
// Vanilla JS, single file, light DOM. The card stylesheet is a constant (no
// config values interpolated); per-card values are custom properties set inline
// on the card root. Entities are found by the integration's translation keys,
// so renamed entity IDs keep working; disabled entities simply don't appear.

const BUILD_NUMBER = 'v2026.10.12.1';
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
  show_when_off: true,
  display_name: 'Display',
  display_aspect: 1.78,
  show_chain: true,
  show_visualizer: true,
  show_hdr: true,
  show_inputs: true,
  show_memory: true,
  show_aspects: true,
  show_picture: true,
  show_remote: true,
  show_admin: true,
  accent_color: '',
  hdr_color: '',
  game_color: '',
};
const SECTIONS = [
  ['show_chain', 'Signal chain (source → Lumagen → display) and status tags'],
  ['show_visualizer', 'Aspect visualizer'],
  ['show_hdr', 'HDR details (when the source is HDR)'],
  ['show_inputs', 'Input chips'],
  ['show_memory', 'Memory A–D'],
  ['show_aspects', 'Aspect ratio chips, NLS and Reset'],
  ['show_picture', 'CMS and Style chips'],
  ['show_remote', 'Menu remote (collapsed)'],
  ['show_admin', 'Admin & link health (collapsed)'],
];

function normalizeConfig(raw) {
  const c = raw && typeof raw === 'object' ? raw : {};
  const out = {};
  if (c.type !== undefined) out.type = c.type;
  Object.keys(DEFAULTS).forEach((k) => {
    if (c[k] === undefined || c[k] === null) return;
    let v = c[k];
    const d = DEFAULTS[k];
    if (typeof d === 'boolean') v = v === true || v === 'true';
    else if (typeof d === 'number') { v = Number(v); if (!Number.isFinite(v)) return; v = Math.round(v * 100) / 100; }
    else v = String(v);
    if (v === d) return;
    out[k] = v;
  });
  Object.keys(c).forEach((k) => { if (!(k in out) && !(k in DEFAULTS) && k !== 'type') out[k] = c[k]; });
  return out;
}

function cfg(config, key) {
  return config[key] !== undefined ? config[key] : DEFAULTS[key];
}

/** Per-card custom properties (inline on the card root; never in the stylesheet). */
function rootStyleVars(config) {
  const vars = [];
  if (config.accent_color) vars.push(`--lmg-accent:${config.accent_color}`);
  if (config.hdr_color) vars.push(`--lmg-hdr:${config.hdr_color}`);
  if (config.game_color) vars.push(`--lmg-game:${config.game_color}`);
  return vars.join(';');
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

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ---------------------------------------------------------------------------
// Card stylesheet — CONSTANT (identical for every instance; see design system §0.9)
// ---------------------------------------------------------------------------
const CARD_CSS = `
.lmg { --lmg-ctx: var(--lmg-accent, var(--primary-color, #2196F3)); padding: 12px 14px 10px; overflow: hidden; }
.lmg.is-hdr { --lmg-ctx: var(--lmg-hdr, #ffb300); }
.lmg.is-game { --lmg-ctx: var(--lmg-game, #4caf50); }
.lmg [hidden] { display: none !important; }
.lmg button { font: inherit; }
.lmg-head { display: flex; align-items: center; gap: 10px; min-height: 36px; }
.lmg-power { flex: 0 0 auto; width: 36px; height: 36px; border-radius: 50%; border: none; cursor: pointer;
  background: transparent; color: var(--disabled-text-color, #777); display: flex; align-items: center; justify-content: center;
  transition: background .2s, color .2s; --mdc-icon-size: 22px; }
.lmg.is-on .lmg-power { color: var(--lmg-ctx); background: color-mix(in srgb, var(--lmg-ctx) 16%, transparent); }
.lmg-title { display: flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 500; white-space: nowrap; }
.lmg-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--disabled-text-color, #777); }
.lmg-dot.ok { background: var(--success-color, #4caf50); }
.lmg-dot.bad { background: var(--error-color, #f44336); }
.lmg-summary { margin-left: auto; min-width: 0; font-size: 13px; color: var(--secondary-text-color);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.lmg.is-down .lmg-summary { color: var(--error-color, #f44336); }
.lmg-standby { padding: 2px 0 2px 46px; font-size: 13px; color: var(--secondary-text-color); }
.lmg-chain { display: grid; grid-template-columns: minmax(0,1fr) auto minmax(0,1fr) auto minmax(0,1fr); gap: 6px; margin-top: 10px; }
.lmg-box { min-width: 0; padding: 8px 6px; border-radius: 10px; text-align: center; background: rgba(127,127,127,0.08); }
.lmg-box-h { font-size: 10px; letter-spacing: .08em; text-transform: uppercase; color: var(--secondary-text-color); }
.lmg-box-t { font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.lmg-box-s { font-size: 12px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.lmg-arrow { align-self: center; color: var(--lmg-ctx); --mdc-icon-size: 18px; }
.lmg-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.lmg-tags:empty { display: none; }
.lmg-tag { padding: 1px 8px; border: 1px solid currentColor; border-radius: 999px; font-size: 11px; font-weight: 600;
  letter-spacing: .04em; color: var(--secondary-text-color); }
.lmg-tag.hdr { color: var(--lmg-hdr, #ffb300); }
.lmg-tag.game { color: var(--lmg-game, #4caf50); }
.lmg-tag.ctx { color: var(--lmg-ctx); }
.lmg-tag.bad { color: var(--error-color, #f44336); }
.lmg-viz { display: flex; align-items: center; gap: 10px; margin-top: 10px; }
.lmg-viz svg { display: block; height: 60px; flex: 0 0 auto; }
.lmg-viz rect { transition: x .4s ease, y .4s ease, width .4s ease, height .4s ease; }
.lmg-raster { fill: #000; stroke: rgba(127,127,127,0.55); stroke-width: 1; }
.lmg-content { fill: color-mix(in srgb, var(--lmg-ctx) 55%, transparent); }
.lmg-screen { fill: rgba(127,127,127,0.10); stroke: rgba(127,127,127,0.6); stroke-width: 1; }
.lmg-image { fill: color-mix(in srgb, var(--lmg-ctx) 55%, transparent); }
.lmg-viz-arrow { color: var(--secondary-text-color); --mdc-icon-size: 16px; flex: 0 0 auto; }
.lmg-legend { min-width: 0; font-size: 12px; line-height: 1.5; color: var(--secondary-text-color); }
.lmg-legend b { color: var(--primary-text-color); font-weight: 600; }
.lmg-hdrp { margin-top: 8px; font-size: 12px; color: var(--secondary-text-color); }
.lmg-hdrp b { color: var(--primary-text-color); }
.lmg-bar { position: relative; height: 6px; margin-top: 4px; border-radius: 3px; background: rgba(127,127,127,0.2); overflow: hidden; }
.lmg-bar > span { position: absolute; inset: 0 auto 0 0; border-radius: 3px; background: var(--lmg-hdr, #ffb300); transition: width .4s ease; }
.lmg-row { display: flex; align-items: flex-start; gap: 8px; margin-top: 8px; }
.lmg-row-l { flex: 0 0 56px; padding-top: 6px; font-size: 12px; color: var(--secondary-text-color); }
.lmg-opts { display: flex; flex-wrap: wrap; gap: 6px; min-width: 0; }
.lmg-chip { padding: 5px 10px; border: 1px solid rgba(127,127,127,0.35); border-radius: 8px; cursor: pointer;
  background: transparent; color: var(--primary-text-color); font-size: 13px; white-space: nowrap; transition: background .2s, border-color .2s; }
.lmg-chip:hover { border-color: var(--lmg-ctx); }
.lmg-chip.on { background: var(--lmg-ctx); border-color: var(--lmg-ctx); color: #fff; }
.lmg-chip.act { border-style: dashed; color: var(--lmg-ctx); }
.lmg-held { outline: 2px solid var(--lmg-ctx); outline-offset: 1px; }
.lmg.is-off .lmg-ctl, .lmg.is-down .lmg-ctl { opacity: .45; pointer-events: none; }
.lmg.is-down [data-sec="chain"] .lmg-chain, .lmg.is-down [data-sec="visualizer"], .lmg.is-down [data-sec="hdr"] { opacity: .45; }
.lmg-fold { margin-top: 10px; border-top: 1px solid rgba(127,127,127,0.2); }
.lmg-fold > summary { display: flex; align-items: center; gap: 6px; padding: 8px 0 2px; cursor: pointer; list-style: none;
  font-size: 13px; color: var(--secondary-text-color); }
.lmg-fold > summary::-webkit-details-marker { display: none; }
.lmg-fold > summary ha-icon { --mdc-icon-size: 18px; transition: transform .2s; }
.lmg-fold[open] > summary ha-icon { transform: rotate(90deg); }
.lmg-pad { display: grid; grid-template-columns: repeat(3, 64px); grid-auto-rows: 44px; gap: 6px; justify-content: center; margin-top: 6px; }
.lmg-key { display: flex; align-items: center; justify-content: center; border: none; border-radius: 10px; cursor: pointer;
  background: rgba(127,127,127,0.12); color: var(--primary-text-color); font-size: 12px; --mdc-icon-size: 22px; }
.lmg-key:hover { background: color-mix(in srgb, var(--lmg-ctx) 20%, transparent); }
.lmg-key.ok { background: color-mix(in srgb, var(--lmg-ctx) 30%, transparent); color: var(--lmg-ctx); }
.lmg-key.sm { color: var(--secondary-text-color); }
.lmg-admin { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 6px; margin-top: 6px; }
.lmg-admin .lmg-chip { text-align: center; }
.lmg-note { margin-top: 8px; font-size: 12px; line-height: 1.5; color: var(--secondary-text-color); }
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
  }

  setConfig(config) {
    if (!config || typeof config !== 'object') throw new Error('Invalid configuration');
    this._config = normalizeConfig(config);
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

  getCardSize() { return 8; }
  getGridOptions() { return { columns: 12, min_columns: 6, rows: 'auto' }; }

  _schedule() {
    if (this._timer) return;
    this._timer = setTimeout(() => { this._timer = null; this._update(false); }, 250);
  }

  // -- build once -----------------------------------------------------------
  _build() {
    const c = this._config;
    const fold = (sec, icon, label, body) => `
      <details class="lmg-fold" data-sec="${sec}">
        <summary><ha-icon icon="mdi:chevron-right"></ha-icon><ha-icon icon="${icon}"></ha-icon>${label}</summary>
        ${body}
      </details>`;
    const key = (cmd, inner, cls = '', hold = '') =>
      `<button class="lmg-key ${cls}" data-tap="remote" data-cmd="${cmd}"${hold ? ' data-hold="remote-repeat"' : ''} aria-label="${cmd}">${inner}</button>`;
    const admin = (id, label) => `<button class="lmg-chip" data-hold="${id}" data-a="${id}">${label}</button>`;
    this.innerHTML = `
      <style>${CARD_CSS}</style>
      <ha-card class="lmg" style="${esc(rootStyleVars(c))}">
        <div class="lmg-head">
          <button class="lmg-power" data-tap="power" data-hold="power-off" aria-label="Power"><ha-icon icon="mdi:power"></ha-icon></button>
          <div class="lmg-title"><span>${esc(cfg(c, 'title'))}</span><span class="lmg-dot" data-k="dot"></span></div>
          <div class="lmg-summary" data-k="summary"></div>
        </div>
        <div class="lmg-standby" data-k="standby" hidden>Standby · tap <ha-icon icon="mdi:power" style="--mdc-icon-size:14px"></ha-icon> to power on</div>
        <div class="lmg-body" data-k="body">
          <div data-sec="chain">
            <div class="lmg-chain">
              <div class="lmg-box"><div class="lmg-box-h">Source</div><div class="lmg-box-t" data-k="s_t"></div><div class="lmg-box-s" data-k="s_1"></div><div class="lmg-box-s" data-k="s_2"></div></div>
              <ha-icon class="lmg-arrow" icon="mdi:chevron-right"></ha-icon>
              <div class="lmg-box"><div class="lmg-box-h">Lumagen</div><div class="lmg-box-t" data-k="l_t"></div><div class="lmg-box-s" data-k="l_1"></div><div class="lmg-box-s" data-k="l_2"></div></div>
              <ha-icon class="lmg-arrow" icon="mdi:chevron-right"></ha-icon>
              <div class="lmg-box"><div class="lmg-box-h">${esc(cfg(c, 'display_name'))}</div><div class="lmg-box-t" data-k="d_t"></div><div class="lmg-box-s" data-k="d_1"></div><div class="lmg-box-s" data-k="d_2"></div></div>
            </div>
            <div class="lmg-tags" data-k="tags"></div>
          </div>
          <div class="lmg-viz" data-sec="visualizer">
            <svg viewBox="0 0 100 60" width="100" height="60" aria-label="Source frame">
              <rect class="lmg-raster" data-r="raster"></rect><rect class="lmg-content" data-r="content"></rect>
            </svg>
            <ha-icon class="lmg-viz-arrow" icon="mdi:arrow-right"></ha-icon>
            <svg viewBox="0 0 120 60" width="120" height="60" aria-label="Screen">
              <rect class="lmg-screen" data-r="screen"></rect><rect class="lmg-image" data-r="image"></rect>
            </svg>
            <div class="lmg-legend" data-k="legend"></div>
          </div>
          <div class="lmg-hdrp" data-sec="hdr" data-k="hdr"></div>
          <div class="lmg-ctl">
            <div class="lmg-row" data-sec="inputs" data-row="input"><div class="lmg-row-l">Input</div><div class="lmg-opts" data-opts="input"></div></div>
            <div class="lmg-row" data-sec="memory" data-row="memory"><div class="lmg-row-l">Memory</div><div class="lmg-opts" data-opts="memory"></div></div>
            <div class="lmg-row" data-sec="aspects" data-row="aspect"><div class="lmg-row-l">Aspect</div><div class="lmg-opts">
              <span class="lmg-opts" data-opts="aspect"></span>
              <button class="lmg-chip act" data-tap="nls" data-a="nls_btn">NLS</button>
              <button class="lmg-chip act" data-tap="reset_aa" data-a="reset_aa">Reset</button>
            </div></div>
            <div class="lmg-row" data-sec="picture" data-row="cms"><div class="lmg-row-l">CMS</div><div class="lmg-opts" data-opts="cms"></div></div>
            <div class="lmg-row" data-sec="picture" data-row="style"><div class="lmg-row-l">Style</div><div class="lmg-opts" data-opts="style"></div></div>
          </div>
          ${fold('remote', 'mdi:remote', 'Menu remote', `
            <div class="lmg-pad">
              ${key('menu', 'Menu', 'sm')}${key('up', '<ha-icon icon="mdi:chevron-up"></ha-icon>', '', 1)}${key('exit', 'Exit', 'sm')}
              ${key('left', '<ha-icon icon="mdi:chevron-left"></ha-icon>', '', 1)}${key('ok', 'OK', 'ok')}${key('right', '<ha-icon icon="mdi:chevron-right"></ha-icon>', '', 1)}
              ${key('clear', 'Clear', 'sm')}${key('down', '<ha-icon icon="mdi:chevron-down"></ha-icon>', '', 1)}${key('help', 'Help', 'sm')}
            </div>
            <div class="lmg-hint">Hold an arrow to repeat it 5×</div>`)}
          ${fold('admin', 'mdi:tools', 'Admin & link', `
            <div class="lmg-admin">
              ${admin('hotplug', 'Hotplug')}${admin('restart', 'Restart outputs')}${admin('reload', 'Reload config')}
              ${admin('osd_test', 'OSD test')}${admin('osd_clear', 'Clear OSD')}${admin('alt', 'ALT')}
            </div>
            <div class="lmg-hint">Hold a button to run it</div>
            <div class="lmg-note" data-k="link"></div>
            <div class="lmg-note" data-k="missing"></div>`)}
        </div>
      </ha-card>`;
    this._root = this.querySelector('.lmg');
    this._k = {};
    this.querySelectorAll('[data-k]').forEach((el) => { this._k[el.dataset.k] = el; });
    this._r = {};
    this.querySelectorAll('[data-r]').forEach((el) => { this._r[el.dataset.r] = el; });
    this._bind();
    this._built = true;
    this._sig = '';
    this._optSig = {};
    this._update(true);
  }

  // -- input handling ---------------------------------------------------------
  _bind() {
    const root = this._root;
    const target = (e) => e.target.closest && e.target.closest('[data-tap],[data-hold],[data-opt]');
    root.addEventListener('pointerdown', (e) => {
      const el = target(e);
      if (!el || el.dataset.opt !== undefined || !el.dataset.hold) return;
      const press = { el, held: false };
      press.timer = setTimeout(() => {
        press.held = true;
        el.classList.add('lmg-held');
        setTimeout(() => el.classList.remove('lmg-held'), 300);
        this._run(el.dataset.hold, el);
      }, 500);
      this._press = press;
    });
    const cancel = () => { if (this._press) { clearTimeout(this._press.timer); this._press = null; } };
    root.addEventListener('pointerleave', cancel);
    root.addEventListener('pointercancel', cancel);
    root.addEventListener('contextmenu', (e) => { if (target(e)) e.preventDefault(); });
    root.addEventListener('click', (e) => {
      const el = target(e);
      if (!el) return;
      const press = this._press;
      this._press = null;
      if (press) clearTimeout(press.timer);
      if (press && press.el === el && press.held) return; // hold already ran
      if (el.dataset.opt !== undefined) { this._select(el.dataset.ent, el.dataset.opt); return; }
      if (el.dataset.tap) this._run(el.dataset.tap, el);
      else if (el.dataset.hold) this._toast(el.dataset.hold === 'power-off' ? 'Hold to put the Lumagen in standby' : 'Hold to run');
    });
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
        const on = this._hass && E.power && this._hass.states[E.power] && this._hass.states[E.power].state === 'on';
        if (on) this._toast('Hold to put the Lumagen in standby');
        else if (E.power) this._call('switch', 'turn_on', { entity_id: E.power });
        break;
      }
      case 'power-off': if (E.power) this._call('switch', 'turn_off', { entity_id: E.power }); break;
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

  // -- visibility -------------------------------------------------------------
  _applyVisibility() {
    if (!this._built) return;
    const hide = !cfg(this._config, 'show_when_off') && this._powerState === 'off' && !this._editMode && !this._preview;
    this.style.display = hide ? 'none' : '';
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
    K.dot.className = 'lmg-dot' + (link === 'on' ? ' ok' : link === 'off' ? ' bad' : '');
    K.dot.title = link === 'on' ? 'Link OK' : link === 'off' ? 'Link down' : '';
    const summary = !found ? 'No Lumagen found — pick a device in the card editor'
      : isDown ? 'Offline'
      : !isOn ? 'Standby'
        : [v('input_label'), v('src_dr'), v('out_aspect')].filter(okState).join(' · ');
    set('summary', summary);
    K.standby.hidden = !found || isOn || isDown;
    K.body.hidden = !found || (!isOn && !isDown);

    // sections on/off (config) + entity availability
    const secOn = (name) => cfg(c, 'show_' + name);
    this.querySelectorAll('[data-sec]').forEach((el) => {
      const sec = el.dataset.sec;
      let show = secOn(sec);
      if (sec === 'remote') show = show && !!E.remote;
      if (sec === 'hdr') show = show && isHdr && okState(v('hdr_max'));
      el.hidden = !show;
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
    if (isOn && v('nls') === 'True') tags.push(['NLS', 'ctx']);
    if (isOn && v('auto_aspect') === 'on') tags.push(['AUTO AR', '']);
    if (isOn && okState(v('src_3d')) && v('src_3d') !== 'Off') tags.push([`3D ${v('src_3d')}`, '']);
    if (isOn && v('video_status') === 'No Source') tags.push(['NO SOURCE', 'bad']);
    if (isOn && v('video_status') === 'Test Pattern') tags.push(['TEST PATTERN', '']);
    const tagHtml = tags.map(([t, cls]) => `<span class="lmg-tag ${cls}">${esc(t)}</span>`).join('');
    if (K.tags.innerHTML !== tagHtml) K.tags.innerHTML = tagHtml;

    // visualizer
    this._drawViz(v);

    // HDR panel
    if (isHdr && okState(v('hdr_max'))) {
      const max = Math.round(Number(v('hdr_max')));
      const min = okState(v('hdr_min')) ? Number(v('hdr_min')) : null;
      const cll = okState(v('hdr_cll')) ? Math.round(Number(v('hdr_cll'))) : 0;
      const pct = max > 0 && cll > 0 ? Math.min(100, (cll / max) * 100) : 0;
      const html = `Mastered <b>${max} nits</b>${min !== null ? ` · min ${min}` : ''}${cll ? ` · MaxCLL <b>${cll}</b>` : ''}`
        + (cll ? `<div class="lmg-bar"><span style="width:${pct.toFixed(1)}%"></span></div>` : '');
      if (K.hdr.innerHTML !== html) K.hdr.innerHTML = html;
    }

    // chip rows
    this._chips('input', E.input, st('input'));
    this._chips('memory', E.memory, st('memory'), (o) => o.replace(/^MEM/, ''));
    this._chips('aspect', E.aspect, st('aspect'), (o) => o);
    this._chips('cms', E.cms, st('cms'));
    this._chips('style', E.style, st('style'));
    this.querySelectorAll('[data-row]').forEach((row) => {
      if (!secOn(row.dataset.sec)) return;
      row.hidden = !E[row.dataset.row];
    });
    this.querySelectorAll('[data-a]').forEach((b) => {
      const a = b.dataset.a;
      const svc = (n) => !!(h.services && h.services.lumagen && h.services.lumagen[n]);
      const avail = {
        nls_btn: !!E.nls_btn, reset_aa: !!E.reset_aa, restart: !!E.restart, reload: !!E.reload,
        hotplug: !!E.remote && svc('hotplug'), osd_test: !!E.remote && svc('show_osd_volume'),
        osd_clear: !!E.remote && svc('clear_osd_message'), alt: !!E.remote,
      }[a];
      b.hidden = !avail;
    });

    // admin notes
    const ls = st('connected');
    if (ls) {
      const a = ls.attributes || {};
      const why = a.last_disconnect_reason;
      set('link', `Link ${ls.state === 'on' ? 'connected' : 'DOWN'} · ${a.reconnects || 0} reconnects · watchdog ${a.watchdog || '—'}${why ? ` · last: ${why}` : ''}`);
      K.link.className = 'lmg-note' + (ls.state === 'on' ? '' : ' bad');
    } else {
      set('link', 'Link status needs the LTek lumagen integration (Connected sensor not found).');
      K.link.className = 'lmg-note';
    }
    const missing = Object.entries(OPTIONAL_ENTITIES).filter(([k]) => !E[k]).map(([, n]) => n);
    set('missing', missing.length ? `Disabled: ${missing.join(' · ')} — enable in Settings → Devices & services → Lumagen → device → Entities.` : '');
    K.missing.hidden = !missing.length;

    this._applyVisibility();
  }

  _chips(name, entityId, state, label = chipLabel) {
    const box = this.querySelector(`[data-opts="${name}"]`);
    if (!box) return;
    const options = (state && state.attributes && state.attributes.options) || [];
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
    const content = parseAspect(v('src_content')) || raster;
    const screen = Number(cfg(this._config, 'display_aspect')) || 1.78;
    const out = parseAspect(v('out_aspect')) || screen;
    const r = fitRect(2, 2, 96, 56, raster);
    const ct = fitRect(r.x, r.y, r.w, r.h, content);
    const s = fitRect(2, 2, 116, 56, screen);
    const im = fitRect(s.x, s.y, s.w, s.h, out);
    const put = (el, g) => {
      if (!el) return;
      ['x', 'y'].forEach((k) => { el.setAttribute(k, g[k].toFixed(2)); el.style[k] = g[k].toFixed(2) + 'px'; });
      el.setAttribute('width', g.w.toFixed(2)); el.style.width = g.w.toFixed(2) + 'px';
      el.setAttribute('height', g.h.toFixed(2)); el.style.height = g.h.toFixed(2) + 'px';
    };
    put(this._r.raster, r); put(this._r.content, ct); put(this._r.screen, s); put(this._r.image, im);
    const f = (n) => n.toFixed(2);
    const html = `Content <b>${f(content)}</b>${Math.abs(content - raster) > 0.01 ? ` in ${f(raster)} frame` : ''}<br>`
      + `Output <b>${f(out)}</b> on ${f(screen)} screen`;
    if (this._k.legend.innerHTML !== html) this._k.legend.innerHTML = html;
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
const COLOR_OPTS = [
  ['accent_color', 'Accent', 'Theme primary', '#2196f3'],
  ['hdr_color', 'HDR', 'Amber', '#ffb300'],
  ['game_color', 'Game mode', 'Green', '#4caf50'],
];
const ASPECT_PRESETS = [1.33, 1.78, 1.85, 2.0, 2.2, 2.35, 2.4];

function colorMode(cur) {
  cur = cur == null ? '' : String(cur);
  if (cur === '') return 'default';
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
        .lmge-sec > summary::-webkit-details-marker { display: none; }
        .lmge-sec > summary > ha-icon:not(.chev) { color: var(--ltek-c-accent); --mdc-icon-size: var(--ltek-icon-lg); }
        .lmge-sec > summary .chev { margin-left: auto; color: #999; --mdc-icon-size: 22px; transition: transform .2s ease; transform: rotate(-90deg); }
        .lmge-sec[open] > summary .chev { transform: none; }
        .lmge-body { padding: 0 16px 16px; }
        .lmge-hint { color: var(--ltek-c-muted); font-size: var(--ltek-fs-small); margin: 0 0 var(--ltek-sp-3); }
        .lmge-group { color: var(--accent-color, var(--ltek-c-accent)); font-size: var(--ltek-fs-group); font-weight: var(--ltek-fw-semibold);
          margin-top: var(--ltek-sp-4); padding-top: var(--ltek-sp-3); border-top: 1px solid var(--ltek-c-border-soft); }
        .lmge-row { display: flex; align-items: center; gap: var(--ltek-sp-4); padding: var(--ltek-sp-1) 0; flex-wrap: wrap; justify-content: flex-start; }
        .lmge-row label.lbl { color: var(--ltek-c-label); font-size: var(--ltek-fs-body); font-weight: var(--ltek-fw-normal); flex: none; }
        .lmge-row input[type="text"], .lmge-row select { flex: 1 1 auto; min-width: 0; padding: var(--ltek-ctrl-pad);
          background: var(--secondary-background-color, #2a2a2a); border: 1px solid var(--ltek-c-border); border-radius: var(--ltek-r-ctrl);
          color: var(--ltek-c-text); font-size: var(--ltek-fs-body); }
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
        .lmge-foot { color: var(--ltek-c-muted); font-size: var(--ltek-fs-tiny); text-align: right; }
`;

class LumagenCardEditor extends HTMLElement {
  constructor() {
    super();
    this._config = {};
    this._open = new Set(['device']);
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

  _set(key, value) {
    if (value === '' || value === undefined || value === null || value === DEFAULTS[key]) delete this._config[key];
    else this._config[key] = value;
    this._emit();
  }

  _panel(id, icon, title, body) {
    return `<details class="lmge-sec" data-panel="${id}"${this._open.has(id) ? ' open' : ''}>
      <summary><ha-icon icon="${icon}"></ha-icon>${title}<ha-icon class="chev" icon="mdi:chevron-down"></ha-icon></summary>
      <div class="lmge-body">${body}</div></details>`;
  }

  _colorControl(key, label, defaultLabel, seedHex) {
    const cur = this._config[key] || '';
    // The mode picked in this editor session wins (e.g. Custom CSS holding a listed theme var);
    // otherwise classify the stored value.
    const mode = this._cmode[key] || (cur ? colorMode(cur) : 'default');
    let field = '';
    if (mode === 'theme') {
      field = `<select class="lmge-ctheme" data-ckey="${key}">${THEME_COLORS.map(([v, n]) => `<option value="${v}"${v === cur ? ' selected' : ''}>${n}</option>`).join('')}</select>`;
    } else if (mode === 'custom') {
      const hex = /^#[0-9a-fA-F]{6}$/.test(cur) ? cur : seedHex;
      field = `<input type="color" class="lmge-chex" data-ckey="${key}" value="${hex}">`;
    } else if (mode === 'css') {
      field = `<input type="text" class="lmge-ccss" data-ckey="${key}" value="${esc(cur)}" placeholder="e.g. tomato, rgba(…), var(--my-color)">`;
    }
    const modes = [['default', defaultLabel], ['theme', 'Theme color'], ['custom', 'Custom color'], ['css', 'Custom CSS']];
    return `<div class="lmge-row"><label class="lbl">${label}</label><div class="lmge-color">
      <select class="lmge-cmode" data-ckey="${key}" data-seed="${seedHex}">${modes.map(([m, n]) => `<option value="${m}"${m === mode ? ' selected' : ''}>${n}</option>`).join('')}</select>
      ${field}</div></div>`;
  }

  _render() {
    if (!this._hass) return;
    const c = this._config;
    const devices = listDevices(this._hass);
    const dev = cfg(c, 'device');
    const aspect = Number(cfg(c, 'display_aspect'));
    const deviceBody = `
      <p class="lmge-hint">Which Lumagen to show. Entities are found automatically, so renamed entity IDs keep working.</p>
      <div class="lmge-row"><label class="lbl">Device</label>
        <select data-key="device">
          <option value="">${devices.length ? 'Auto (first Lumagen found)' : 'No Lumagen device found'}</option>
          ${devices.map((d) => `<option value="${esc(d.id)}"${d.id === dev ? ' selected' : ''}>${esc(d.name)}</option>`).join('')}
          ${dev && !devices.some((d) => d.id === dev) ? `<option value="${esc(dev)}" selected>${esc(dev)} (not found)</option>` : ''}
        </select></div>`;
    const cardBody = `
      <p class="lmge-hint">Header title and what the card does while the Lumagen is off.</p>
      <div class="lmge-row"><label class="lbl">Title</label><input type="text" data-key="title" value="${esc(cfg(c, 'title'))}"></div>
      <label class="lmge-check"><input type="checkbox" data-key="show_when_off"${cfg(c, 'show_when_off') ? ' checked' : ''}>
        Show a one-line Standby bar when the Lumagen is off (otherwise hide the card)</label>`;
    const secBody = `
      <p class="lmge-hint">Turn parts of the card on or off. Rows for entities that are disabled in the integration hide themselves and are listed in Admin.</p>
      ${SECTIONS.map(([k, n]) => `<label class="lmge-check"><input type="checkbox" data-key="${k}"${cfg(c, k) ? ' checked' : ''}>${n}</label>`).join('')}`;
    const screenBody = `
      <p class="lmge-hint">Your screen, for the aspect visualizer and the third box of the signal chain.</p>
      <div class="lmge-row"><label class="lbl">Display name</label><input type="text" data-key="display_name" value="${esc(cfg(c, 'display_name'))}"></div>
      <div class="lmge-group">Screen shape</div>
      <div class="lmge-row lmge-nowrap"><label class="lbl">Aspect</label>
        <input type="range" data-key="display_aspect" min="1.33" max="2.76" step="0.01" value="${aspect}">
        <span class="lmge-val" data-val="display_aspect">${aspect.toFixed(2)}</span></div>
      <div class="lmge-presets">${ASPECT_PRESETS.map((p) => `<button class="lmge-preset${Math.abs(p - aspect) < 0.005 ? ' on' : ''}" data-preset="${p}">${p.toFixed(2)}</button>`).join('')}</div>`;
    const colorBody = `
      <p class="lmge-hint">The card tints itself by context: the accent normally, the HDR color while HDR plays, the game color in game mode.</p>
      ${COLOR_OPTS.map(([k, l, d, seed]) => this._colorControl(k, l, d, seed)).join('')}`;
    this.innerHTML = `<style>${EDITOR_CSS}</style>
      <div class="lmge">
        ${this._panel('device', 'mdi:video-input-hdmi', 'Device', deviceBody)}
        ${this._panel('card', 'mdi:card-text-outline', 'Card', cardBody)}
        ${this._panel('sections', 'mdi:view-list', 'Sections', secBody)}
        ${this._panel('screen', 'mdi:projector-screen-outline', 'Screen', screenBody)}
        ${this._panel('colors', 'mdi:palette', 'Colors', colorBody)}
        <div class="lmge-foot">Lumagen Card ${BUILD_NUMBER}</div>
      </div>`;
    this._rendered = true;
    this._wire();
  }

  _wire() {
    this.querySelectorAll('details.lmge-sec').forEach((d) => d.addEventListener('toggle', () => {
      if (d.open) this._open.add(d.dataset.panel); else this._open.delete(d.dataset.panel);
    }));
    this.querySelectorAll('[data-key]').forEach((el) => {
      const key = el.dataset.key;
      if (el.type === 'checkbox') el.addEventListener('change', () => this._set(key, el.checked));
      else if (el.type === 'range') {
        el.addEventListener('input', () => {
          const out = this.querySelector(`[data-val="${key}"]`);
          if (out) out.textContent = Number(el.value).toFixed(2);
        });
        el.addEventListener('change', () => { this._set(key, Number(el.value)); this._render(); });
      } else if (el.tagName === 'SELECT') el.addEventListener('change', () => this._set(key, el.value));
      else el.addEventListener('change', () => this._set(key, el.value));
    });
    this.querySelectorAll('[data-preset]').forEach((b) => b.addEventListener('click', () => {
      this._set('display_aspect', Number(b.dataset.preset));
      this._render();
    }));
    this.querySelectorAll('.lmge-cmode').forEach((sel) => sel.addEventListener('change', () => {
      const key = sel.dataset.ckey;
      const cur = this._config[key] || '';
      const was = cur ? colorMode(cur) : 'default';
      let next = '';
      // Seed the new mode from the old value; never drop the user's color on a mode change.
      if (sel.value === 'theme') next = was === 'theme' ? cur : 'var(--primary-color)';
      else if (sel.value === 'custom') next = /^#[0-9a-fA-F]{6}$/.test(cur) ? cur : sel.dataset.seed;
      else if (sel.value === 'css') next = cur;
      this._cmode[key] = sel.value;
      this._set(key, next);
      this._render();
    }));
    this.querySelectorAll('.lmge-ctheme').forEach((s) => s.addEventListener('change', () => this._set(s.dataset.ckey, s.value)));
    this.querySelectorAll('.lmge-chex').forEach((i) => i.addEventListener('input', () => this._set(i.dataset.ckey, i.value)));
    this.querySelectorAll('.lmge-ccss').forEach((i) => i.addEventListener('change', () => this._set(i.dataset.ckey, i.value.trim())));
  }
}

// Test hooks (pure helpers; no effect in the browser)
LumagenCard._test = {
  BUILD_NUMBER, CARD_CSS, EDITOR_CSS, DEFAULTS, ENTITY_KEYS, OPTIONAL_ENTITIES,
  normalizeConfig, rootStyleVars, resolveEntities, listDevices, parseAspect, fitRect, fmtVideo, chipLabel, colorMode,
};

if (!customElements.get(CARD_TAG)) customElements.define(CARD_TAG, LumagenCard);
if (!customElements.get(EDITOR_TAG)) customElements.define(EDITOR_TAG, LumagenCardEditor);

window.customCards = window.customCards || [];
if (!window.customCards.some((c) => c.type === CARD_TAG)) {
  window.customCards.push({
    type: CARD_TAG,
    name: 'Lumagen Card',
    description: 'Lumagen Radiance Pro: signal chain, aspect visualizer, HDR details, one-tap controls, remote and admin.',
    preview: false,
    documentationURL: 'https://github.com/Ltek/lumagen-card',
  });
}

console.info(`%c LUMAGEN-CARD %c ${BUILD_NUMBER} `, 'color:#fff;background:#2196F3;font-weight:700', 'color:#2196F3;background:transparent');
