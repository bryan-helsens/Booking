import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { TenantGuard } from '../../common/tenant.guard';

@Controller('auth')
@UseGuards(TenantGuard)
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  // Tighten against brute force: max 8 login attempts/minute/IP.
  @Throttle({ default: { limit: 8, ttl: 60000 } })
  @Post('login')
  login(@Body() body: { email: string; password: string }) {
    return this.auth.login(body.email, body.password);
  }

  @Get('oauth/:provider')
  oauth(@Param('provider') provider: string) {
    return this.auth.oauthStub(provider);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('forgot')
  forgot(@Body() body: { email: string }) {
    return this.auth.forgotPassword(body.email);
  }

  @Throttle({ default: { limit: 8, ttl: 60000 } })
  @Post('reset')
  reset(@Body() body: { email: string; token: string; password: string }) {
    return this.auth.resetPassword(body.email, body.token, body.password);
  }
}
