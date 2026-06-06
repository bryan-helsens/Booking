import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ClsService } from 'nestjs-cls';

// Tenant-scoped models — auto-filtered by tenantId on read operations
// as a defense-in-depth safety net (services also pass tenantId explicitly).
const TENANT_MODELS = new Set([
  'Domain',
  'User',
  'ThemeConfig',
  'SiteContent',
  'Page',
  'FeatureFlag',
  'Service',
  'BusinessHours',
  'Booking',
]);
const READ_ACTIONS = new Set(['findFirst', 'findMany', 'count', 'aggregate']);

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(private readonly cls: ClsService) {
    super();
  }

  async onModuleInit() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const cls = this.cls;
    this.$use(async (params, next) => {
      const tenantId = cls?.get('tenantId');
      if (tenantId && params.model && TENANT_MODELS.has(params.model) && params.action && READ_ACTIONS.has(params.action)) {
        params.args = params.args || {};
        params.args.where = { ...(params.args.where || {}), tenantId };
      }
      return next(params);
    });
    await this.$connect();
  }
}
