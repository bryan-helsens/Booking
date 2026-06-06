import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ClsModule, ClsMiddleware } from 'nestjs-cls';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { TenantMiddleware } from './common/tenant.middleware';
import { AuthModule } from './modules/auth/auth.module';
import { SiteModule } from './modules/site/site.module';
import { PagesModule } from './modules/pages/pages.module';
import { BookingModule } from './modules/booking/booking.module';
import { MediaModule } from './modules/media/media.module';

@Module({
  imports: [
    ClsModule.forRoot({ global: true, middleware: { mount: false } }),
    PrismaModule,
    CommonModule,
    AuthModule,
    SiteModule,
    PagesModule,
    BookingModule,
    MediaModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // ClsMiddleware must run first so the tenant context has somewhere to live.
    consumer.apply(ClsMiddleware, TenantMiddleware).forRoutes('*');
  }
}
