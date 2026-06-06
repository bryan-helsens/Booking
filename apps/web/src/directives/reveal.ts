import type { Directive } from 'vue';

/**
 * v-reveal — fades/slides an element in once it scrolls into view.
 * Used to give the storefront subtle, professional motion.
 */
const observer =
  typeof IntersectionObserver !== 'undefined'
    ? new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add('in-view');
              obs.unobserve(e.target);
            }
          });
        },
        { threshold: 0.12 },
      )
    : null;

export const reveal: Directive = {
  mounted(el: HTMLElement) {
    el.classList.add('reveal');
    if (observer) {
      observer.observe(el);
      // Safety net: never leave content stuck hidden if the observer
      // doesn't fire (e.g. element already on-screen, edge browsers).
      setTimeout(() => el.classList.add('in-view'), 1500);
    } else {
      el.classList.add('in-view');
    }
  },
  unmounted(el: HTMLElement) {
    observer?.unobserve(el);
  },
};
