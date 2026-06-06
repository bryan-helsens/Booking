import type { ThemeTokens } from '@/types';

/**
 * Theme Engine: maps database design tokens → CSS custom properties on :root,
 * and overrides Element Plus' own variables so the entire UI re-themes
 * instantly, without a rebuild. This is the single source of truth for styling.
 */
export function applyTokens(tokens: ThemeTokens, mode: 'light' | 'dark') {
  const root = document.documentElement;

  // Our app-level tokens
  root.style.setProperty('--app-color-primary', tokens.colorPrimary);
  root.style.setProperty('--app-color-secondary', tokens.colorSecondary);
  root.style.setProperty('--app-color-accent', tokens.colorAccent);
  root.style.setProperty('--app-color-bg', tokens.colorBg);
  root.style.setProperty('--app-color-text', tokens.colorText);
  root.style.setProperty('--app-font-body', tokens.fontBody);
  root.style.setProperty('--app-font-heading', tokens.fontHeading);
  root.style.setProperty('--app-radius', `${tokens.radius}px`);

  // Element Plus mapping — brand color + derived light shades
  root.style.setProperty('--el-color-primary', tokens.colorPrimary);
  for (let i = 1; i <= 9; i++) {
    root.style.setProperty(`--el-color-primary-light-${i}`, mix(tokens.colorPrimary, mode === 'dark' ? '#000000' : '#ffffff', i / 10));
  }
  root.style.setProperty('--el-color-success', tokens.colorPrimary);
  root.style.setProperty('--el-border-radius-base', `${tokens.radius}px`);
  root.style.setProperty('--el-font-family', tokens.fontBody);

  // Dark / light mode toggles Element Plus' built-in dark theme class.
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
