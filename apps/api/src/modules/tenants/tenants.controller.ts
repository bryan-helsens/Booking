import { Body, Controller, Get, Post } from '@nestjs/common';
import { TenantsService } from './tenants.service';

/**
 * Platform-level endpoints (NOT tenant-scoped) — no X-Tenant required.
 * Used for self-service onboarding and the demo tenant switcher.
 */
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenants: TenantsService) {}

  @Get()
  list() {
    return this.tenants.list();
  }

  @Post()
  create(@Body() body: { companyName: string; email: string; password: string; description?: string; theme?: string }) {
    return this.tenants.create(body);
  }
}
