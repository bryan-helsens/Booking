import type { Component } from 'vue';
import HeroSection from './sections/HeroSection.vue';
import ServicesSection from './sections/ServicesSection.vue';
import RichTextSection from './sections/RichTextSection.vue';
import TestimonialsSection from './sections/TestimonialsSection.vue';
import ContactSection from './sections/ContactSection.vue';
import BookingSection from './sections/BookingSection.vue';
import GallerySection from './sections/GallerySection.vue';
import OpeningHoursSection from './sections/OpeningHoursSection.vue';
import FaqSection from './sections/FaqSection.vue';

/**
 * Frontend component registry: maps a JSON `section.type` → Vue component.
 * Adding a new block = add a component + register it here (+ seed a
 * ComponentDefinition). No database migration required.
 */
export const sectionRegistry: Record<string, Component> = {
  hero: HeroSection,
  services: ServicesSection,
  richtext: RichTextSection,
  testimonials: TestimonialsSection,
  contact: ContactSection,
  booking: BookingSection,
  gallery: GallerySection,
  openinghours: OpeningHoursSection,
  faq: FaqSection,
};

export function resolveSection(type: string): Component | null {
  return sectionRegistry[type] ?? null;
}
