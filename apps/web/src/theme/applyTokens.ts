import type { ThemeTokens } from '@/types';
import { ensureFonts } from './fonts';

/**
 * Theme Engine: maps database design tokens → CSS custom properties on :root,
 * and overrides Element Plus' own variables so the ENTIRE UI (including EP's
 * surfaces, fills, borders and text) re-themes coherently in both light and
 * dark mode, instantly, without a rebuild. Single source of truth for styling.
 */
export function applyTokens(tokens: ThemeTokens, mode: 'light' | 'dark') {
  const root = document.documentElement;
  const set = (k: string, v: string) => root.style.setProperty(k, v);

  ensureFonts([tokens.fontBody, tokens.fontHeading]);

  const bg = tokens.colorBg;
  const text = tokens.colorText;

  // App-level tokens
  set('--app-color-primary', tokens.colorPrimary);
  set('--app-color-secondary', tokens.colorSecondary);
  set('--app-color-accent', tokens.colorAccent);
  set('--app-color-bg', bg);
  set('--app-color-text', text);
  set('--app-font-body', tokens.fontBody);
  set('--app-font-heading', tokens.fontHeading);
  set('--app-radius', `${tokens.radius}px`);

  // ── Element Plus: brand color + tints (tints blend toward the bg so they
  //    stay subtle in both light and dark mode) ──
  set('--el-color-primary', tokens.colorPrimary);
  for (let i = 1; i <= 9; i++) set(`--el-color-primary-light-${i}`, mix(tokens.colorPrimary, bg, i / 10));
  set('--el-color-primary-dark-2', mix(tokens.colorPrimary, text, 0.2));
  set('--el-border-radius-base', `${tokens.radius}px`);
  set('--el-font-family', tokens.fontBody);

  // ── Surfaces / page background ──
  set('--el-bg-color', bg);
  set('--el-bg-color-overlay', bg);
  set('--el-bg-color-page', mix(bg, text, 0.03));

  // ── Text colors (blend text toward bg for softer secondary tones) ──
  set('--el-text-color-primary', text);
  set('--el-text-color-regular', mix(text, bg, 0.14));
  set('--el-text-color-secondary', mix(text, bg, 0.42));
  set('--el-text-color-placeholder', mix(text, bg, 0.56));
  set('--el-text-color-disabled', mix(text, bg, 0.68));

  // ── Borders (blend bg toward text) ──
  set('--el-border-color-darker', mix(bg, text, 0.3));
  set('--el-border-color-dark', mix(bg, text, 0.24));
  set('--el-border-color', mix(bg, text, 0.18));
  set('--el-border-color-light', mix(bg, text, 0.12));
  set('--el-border-color-lighter', mix(bg, text, 0.08));
  set('--el-border-color-extra-light', mix(bg, text, 0.05));

  // ── Fills (used for section/alternating backgrounds) ──
  set('--el-fill-color-darker', mix(bg, text, 0.13));
  set('--el-fill-color-dark', mix(bg, text, 0.1));
  set('--el-fill-color', mix(bg, text, 0.08));
  set('--el-fill-color-light', mix(bg, text, 0.05));
  set('--el-fill-color-lighter', mix(bg, text, 0.03));
  set('--el-fill-color-extra-light', mix(bg, text, 0.02));
  set('--el-fill-color-blank', bg);

  // Keep semantic status colors (success/warning/danger) at EP defaults so
  // booking statuses stay meaningful; the `.dark` class supplies dark variants.
  root.classList.toggle('dark', mode === 'dark');
  root.setAttribute('data-theme', mode);
}

/** Linear blend of two hex colors (ratio 0..1 toward `b`). */
function mix(a: string, b: string, ratio: number): string {
  const pa = hexToRgb(a);
  const pb = hexToRgb(b);
  if (!pa || !pb) return a;
  const r = Math.round(pa.r + (pb.r - pa.r) * ratio);
  const g = Math.round(pa.g + (pb.g - pa.g) * ratio);
  const bl = Math.round(pa.b + (pb.b - pa.b) * ratio);
  return `rgb(${r}, ${g}, ${bl})`;
}

function hexToRgb(hex: string) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : null;
}
