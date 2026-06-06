import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { TenantGuard } from '../../common/tenant.guard';

@Controller('auth')
@UseGuards(TenantGuard)
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  login(@Body() body: { email: string; password: string }) {
    return this.auth.login(body.email, body.password);
  }

  @Get('oauth/:provider')
  oauth(@Param('provider') provider: string) {
    return this.auth.oauthStub(provider);
  }
}
