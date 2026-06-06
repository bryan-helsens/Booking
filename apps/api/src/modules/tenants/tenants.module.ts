import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';

@Module({
  imports: [JwtModule.register({ secret: process.env.JWT_SECRET || 'demo-secret' })],
  controllers: [TenantsController],
  providers: [TenantsService],
})
export class TenantsModule {}
