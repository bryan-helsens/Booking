import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContext } from '../../common/tenant-context.service';
import { parseJson, toJson } from '../../common/json';

@Injectable()
export class SiteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: TenantContext,
  ) {}

  // ── Mappers (JSON-as-string ↔ object) ──
  private mapTheme(t: any) {
    if (!t) return null;
    return { ...t, tokens: parseJson(t.tokens, {}), draft: t.draft ? parseJson(t.draft, null) : null };
  }
  private mapContent(c: any) {
    if (!c) return null;
    return { ...c, contact: parseJson(c.contact, {}), seo: parseJson(c.seo, {}), social: parseJson(c.social, {}) };
  }

  /** One bootstrap payload the storefront uses to render everything. */
  async bootstrap() {
    const tenantId = this.ctx.id;
    const [tenant, theme, content, flags] = await Promise.all([
      this.prisma.tenant.findUnique({ where: { id: tenantId } }),
      this.prisma.themeConfig.findUnique({ where: { tenantId } }),
      this.prisma.siteContent.findUnique({ where: { tenantId } }),
      this.prisma.featureFlag.findMany({ where: { tenantId } }),
    ]);
    if (!tenant) throw new NotFoundException('Tenant not found');
    return {
      tenant: { id: tenant.id, slug: tenant.slug, name: tenant.name },
      theme: this.mapTheme(theme),
      content: this.mapContent(content),
      features: Object.fromEntries(flags.map((f) => [f.key, f.enabled])),
    };
  }

  // ── Theme ──
  async getTheme() {
    return this.mapTheme(await this.prisma.themeConfig.findUnique({ where: { tenantId: this.ctx.id } }));
  }

  async saveThemeDraft(draft: any, mode?: string) {
    const t = await this.prisma.themeConfig.update({
      where: { tenantId: this.ctx.id },
      data: { draft: toJson(draft), ...(mode ? { mode } : {}) },
    });
    return this.mapTheme(t);
  }

  async publishTheme() {
    const cur = await this.prisma.themeConfig.findUnique({ where: { tenantId: this.ctx.id } });
    if (!cur?.draft) return this.mapTheme(cur);
    const t = await this.prisma.themeConfig.update({
      where: { tenantId: this.ctx.id },
      data: { tokens: cur.draft, draft: null },
    });
    return this.mapTheme(t);
  }

  async saveTheme(tokens: any, mode?: string) {
    const t = await this.prisma.themeConfig.update({
      where: { tenantId: this.ctx.id },
      data: { tokens: toJson(tokens), ...(mode ? { mode } : {}) },
    });
    return this.mapTheme(t);
  }

  // ── Content ──
  async getContent() {
    return this.mapContent(await this.prisma.siteContent.findUnique({ where: { tenantId: this.ctx.id } }));
  }

  async saveContent(data: any) {
    const c = await this.prisma.siteContent.update({
      where: { tenantId: this.ctx.id },
      data: {
        companyName: data.companyName,
        description: data.description,
        logoUrl: data.logoUrl,
        faviconUrl: data.faviconUrl,
        contact: toJson(data.contact),
        seo: toJson(data.seo),
        social: toJson(data.social),
      },
    });
    return this.mapContent(c);
  }

  // ── Feature flags ──
  async getFeatures() {
    const flags = await this.prisma.featureFlag.findMany({ where: { tenantId: this.ctx.id } });
    return Object.fromEntries(flags.map((f) => [f.key, f.enabled]));
  }

  async saveFeatures(map: Record<string, boolean>) {
    const tenantId = this.ctx.id;
    await Promise.all(
      Object.entries(map).map(([key, enabled]) =>
        this.prisma.featureFlag.upsert({
          where: { tenantId_key: { tenantId, key } },
          update: { enabled },
          create: { tenantId, key, enabled },
        }),
      ),
    );
    return this.getFeatures();
  }
}
