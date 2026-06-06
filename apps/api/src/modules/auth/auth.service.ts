import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContext } from '../../common/tenant-context.service';
import { verifyPassword } from '../../common/password';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly ctx: TenantContext,
  ) {}

  async login(email: string, password: string) {
    const tenantId = this.ctx.id;
    const user = await this.prisma.user.findFirst({ where: { tenantId, email } });
    if (!user || !(await verifyPassword(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.issue(user);
  }

  /**
   * OAuth structure (stub). A real flow redirects to the provider, then the
   * callback exchanges the code, upserts an OAuthAccount and issues a JWT.
   */
  async oauthStub(provider: string) {
    const tenantId = this.ctx.id;
    const user = await this.prisma.user.findFirst({ where: { tenantId } });
    if (!user) throw new UnauthorizedException('No user for tenant');
    return { provider, ...(await this.issue(user)), note: 'OAuth stub — wired for Google/Microsoft in production.' };
  }

  private async issue(user: { id: string; email: string; name: string; role: string; tenantId: string }) {
    const payload = { sub: user.id, email: user.email, role: user.role, tenantId: user.tenantId };
    const token = await this.jwt.signAsync(payload, { secret: process.env.JWT_SECRET || 'demo-secret', expiresIn: '7d' });
    return { token, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
  }
}
