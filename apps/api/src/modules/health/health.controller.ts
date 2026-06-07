import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/** Liveness/readiness probe for uptime monitoring (no tenant required). */
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    let db = 'down';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      db = 'up';
    } catch {
      /* db unreachable */
    }
    return { status: db === 'up' ? 'ok' : 'degraded', db, uptime: Math.round(process.uptime()) };
  }
}
