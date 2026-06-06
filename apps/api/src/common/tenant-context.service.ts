import { Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';

/** Thin accessor for the request-scoped tenant id/slug. */
@Injectable()
export class TenantContext {
  constructor(private readonly cls: ClsService) {}

  get id(): string {
    return this.cls.get('tenantId');
  }

  get slug(): string {
    return this.cls.get('tenantSlug');
  }
}
