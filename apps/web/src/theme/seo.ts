/**
 * Local-SEO: inject JSON-LD structured data (schema.org LocalBusiness) so a
 * tenant's storefront can show rich results and rank for local searches.
 */
const WEEKDAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

export function injectStructuredData(opts: {
  content: any;
  services: any[];
  reviews: any[];
  hours: any[];
  currency: string;
}) {
  if (typeof document === 'undefined' || !opts.content) return;
  const c = opts.content;

  const data: any = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: c.companyName,
    description: c.seo?.description || c.description || '',
    url: window.location.origin,
  };
  if (c.logoUrl) data.image = c.logoUrl;
  if (c.contact?.email) data.email = c.contact.email;
  if (c.contact?.phone) data.telephone = c.contact.phone;
  if (c.contact?.address) data.address = { '@type': 'PostalAddress', streetAddress: c.contact.address };

  const social = Object.values(c.social || {}).filter(Boolean);
  if (social.length) data.sameAs = social;

  const openHours = (opts.hours || [])
    .filter((h) => !h.isClosed)
    .map((h) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: WEEKDAY[h.weekday],
      opens: hhmm(h.openMin),
      closes: hhmm(h.closeMin),
    }));
  if (openHours.length) data.openingHoursSpecification = openHours;

  if (opts.reviews?.length) {
    const avg = opts.reviews.reduce((s, r) => s + r.rating, 0) / opts.reviews.length;
    data.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: avg.toFixed(1),
      reviewCount: opts.reviews.length,
    };
  }

  if (opts.services?.length) {
    data.makesOffer = opts.services.map((s) => ({
      '@type': 'Offer',
      price: (s.priceCents / 100).toFixed(2),
      priceCurrency: opts.currency || 'EUR',
      itemOffered: { '@type': 'Service', name: s.name, description: s.description || undefined },
    }));
  }

  let el = document.getElementById('ld-json') as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement('script');
    el.id = 'ld-json';
    el.type = 'application/ld+json';
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}
