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
import CtaSection from './sections/CtaSection.vue';
import StatsSection from './sections/StatsSection.vue';
import TeamSection from './sections/TeamSection.vue';
import ImageTextSection from './sections/ImageTextSection.vue';
import VideoSection from './sections/VideoSection.vue';
import FeaturesSection from './sections/FeaturesSection.vue';
import SpacerSection from './sections/SpacerSection.vue';
import PricingSection from './sections/PricingSection.vue';
import MapSection from './sections/MapSection.vue';
import LogosSection from './sections/LogosSection.vue';
import ButtonSection from './sections/ButtonSection.vue';

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
  cta: CtaSection,
  stats: StatsSection,
  team: TeamSection,
  imagetext: ImageTextSection,
  video: VideoSection,
  features: FeaturesSection,
  spacer: SpacerSection,
  pricing: PricingSection,
  map: MapSection,
  logos: LogosSection,
  button: ButtonSection,
};

export function resolveSection(type: string): Component | null {
  return sectionRegistry[type] ?? null;
}
