/**
 * Dynamic web-font loader. The theme stores a CSS font-family string per
 * tenant; here we inject the matching Google Fonts stylesheet so the chosen
 * font is actually rendered (otherwise the font picker would be cosmetic).
 */
const CATALOG: Record<string, string> = {
  Inter: 'Inter:wght@400;500;600;700',
  Poppins: 'Poppins:wght@400;500;600;700',
  Roboto: 'Roboto:wght@400;500;700',
  Oswald: 'Oswald:wght@400;500;600;700',
  Montserrat: 'Montserrat:wght@400;500;600;700',
  Lato: 'Lato:wght@400;700',
  'Playfair Display': 'Playfair+Display:wght@400;600;700',
  Merriweather: 'Merriweather:wght@400;700',
};

/** Pull the primary family name out of a CSS font-family value. */
function primaryFamily(fontFamily: string): string {
  return (fontFamily || '').split(',')[0].replace(/['"]/g, '').trim();
}

let preconnected = false;

export function ensureFonts(families: string[]) {
  if (typeof document === 'undefined') return;
  const names = families.map(primaryFamily).filter((n) => CATALOG[n]);
  if (!names.length) return;

  if (!preconnected) {
    addLink('preconnect', 'https://fonts.googleapis.com');
    addLink('preconnect', 'https://fonts.gstatic.com', true);
    preconnected = true;
  }

  const specs = [...new Set(names)].map((n) => `family=${CATALOG[n]}`).join('&');
  const href = `https://fonts.googleapis.com/css2?${specs}&display=swap`;
  let link = document.getElementById('dynamic-fonts') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.id = 'dynamic-fonts';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }
  if (link.href !== href) link.href = href;
}

export const FONT_OPTIONS = Object.keys(CATALOG).map((name) => ({
  label: name,
  value: `'${name}', system-ui, sans-serif`,
}));

function addLink(rel: string, href: string, crossorigin = false) {
  const l = document.createElement('link');
  l.rel = rel;
  l.href = href;
  if (crossorigin) l.crossOrigin = 'anonymous';
  document.head.appendChild(l);
}
