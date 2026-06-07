import { CanActivate, ExecutionContext, Injectable, BadRequestException } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';

/** Ensures a tenant was resolved for the request (returns 400 otherwise). */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly cls: ClsService) {}

  canActivate(_context: ExecutionContext): boolean {
    const tenantId = this.cls.get('tenantId');
    if (!tenantId) {
      throw new BadRequestException('No tenant resolved. Send an "X-Tenant" header with the tenant slug.');
    }
    return true;
  }
}
