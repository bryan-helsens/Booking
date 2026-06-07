import { Global, Module } from '@nestjs/common';
import { TenantContext } from './tenant-context.service';
import { TenantGuard } from './tenant.guard';

@Global()
@Module({
  providers: [TenantContext, TenantGuard],
  exports: [TenantContext, TenantGuard],
})
export class CommonModule {}
