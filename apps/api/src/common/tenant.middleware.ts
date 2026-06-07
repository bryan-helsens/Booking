import { Injectable, NestMiddleware } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Resolves the active tenant for every request and stores it in the
 * request-scoped CLS context. Resolution order (demo):
 *   1. `X-Tenant` header (tenant slug)  ← used by the SPA
 *   2. Host subdomain  (e.g. acme.localhost → "acme") / Domain table
 *
 * Runs AFTER ClsMiddleware so the CLS context already exists.
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    private readonly cls: ClsService,
    private readonly prisma: PrismaService,
  ) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    const slugHeader = (req.headers['x-tenant'] as string) || '';
    const host = (req.headers.host || '').split(':')[0];
    const subdomain = host.includes('.') ? host.split('.')[0] : '';

    let tenant: { id: string; slug: string } | null = null;
    if (slugHeader) {
      tenant = await this.prisma.tenant.findUnique({ where: { slug: slugHeader } });
    }
    if (!tenant && subdomain && subdomain !== 'localhost' && subdomain !== 'www') {
      const domain = await this.prisma.domain.findUnique({ where: { host }, include: { tenant: true } });
      tenant = domain?.tenant ?? (await this.prisma.tenant.findUnique({ where: { slug: subdomain } }));
    }

    if (tenant) {
      this.cls.set('tenantId', tenant.id);
      this.cls.set('tenantSlug', tenant.slug);
    }
    next();
  }
}
