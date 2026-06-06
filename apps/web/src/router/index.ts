import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    // ── Storefront (public, database-driven) ──
    {
      path: '/',
      component: () => import('@/storefront/StorefrontLayout.vue'),
      children: [
        { path: '', name: 'home', component: () => import('@/storefront/StorefrontPage.vue') },
        { path: 'booking', name: 'booking', component: () => import('@/storefront/BookingPage.vue') },
        { path: 'booking/manage', name: 'manage', component: () => import('@/storefront/ManageBookingView.vue') },
        { path: ':slug', name: 'page', component: () => import('@/storefront/StorefrontPage.vue') },
      ],
    },
    // ── Admin dashboard ──
    { path: '/login', name: 'login', component: () => import('@/admin/LoginView.vue') },
    { path: '/get-started', name: 'onboarding', component: () => import('@/admin/OnboardingView.vue') },
    {
      path: '/admin',
      component: () => import('@/admin/AdminLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        { path: '', name: 'dashboard', component: () => import('@/admin/views/DashboardView.vue') },
        { path: 'branding', name: 'branding', component: () => import('@/admin/views/BrandingView.vue') },
        { path: 'content', name: 'content', component: () => import('@/admin/views/ContentView.vue') },
        { path: 'builder', name: 'builder', component: () => import('@/admin/views/BuilderView.vue') },
        { path: 'services', name: 'services', component: () => import('@/admin/views/ServicesView.vue') },
        { path: 'staff', name: 'staff', component: () => import('@/admin/views/StaffView.vue') },
        { path: 'hours', name: 'hours', component: () => import('@/admin/views/HoursView.vue') },
        { path: 'bookings', name: 'bookings', component: () => import('@/admin/views/BookingsView.vue') },
        { path: 'features', name: 'features', component: () => import('@/admin/views/FeaturesView.vue') },
        { path: 'settings', name: 'settings', component: () => import('@/admin/views/SettingsView.vue') },
      ],
    },
    { path: '/:pathMatch(.*)*', name: 'notfound', component: () => import('@/storefront/NotFound.vue') },
  ],
});

router.beforeEach((to) => {
  if (to.meta.requiresAuth) {
    const auth = useAuthStore();
    if (!auth.isAuthenticated()) return { name: 'login', query: { redirect: to.fullPath } };
  }
  return true;
});
