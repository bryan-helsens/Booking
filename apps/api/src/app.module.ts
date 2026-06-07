import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ClsModule, ClsMiddleware } from 'nestjs-cls';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { TenantMiddleware } from './common/tenant.middleware';
import { AuthModule } from './modules/auth/auth.module';
import { SiteModule } from './modules/site/site.module';
import { PagesModule } from './modules/pages/pages.module';
import { BookingModule } from './modules/booking/booking.module';
import { MediaModule } from './modules/media/media.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { HealthModule } from './modules/health/health.module';
import { BillingModule } from './modules/billing/billing.module';

@Module({
  imports: [
    ClsModule.forRoot({ global: true, middleware: { mount: false } }),
    // Global rate limit: 120 requests / minute / IP (storefront loads several
    // endpoints per page). Stricter per-route limits live on auth/signup.
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
    PrismaModule,
    CommonModule,
    AuthModule,
    SiteModule,
    PagesModule,
    BookingModule,
    MediaModule,
    TenantsModule,
    HealthModule,
    BillingModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // ClsMiddleware must run first so the tenant context has somewhere to live.
    consumer.apply(ClsMiddleware, TenantMiddleware).forRoutes('*');
  }
}
