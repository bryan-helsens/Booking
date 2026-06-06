import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContext } from '../../common/tenant-context.service';
import { parseJson, toJson } from '../../common/json';

@Injectable()
export class PagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: TenantContext,
  ) {}

  private mapPage(p: any, includeDraft: boolean) {
    if (!p) return p;
    const out: any = { ...p, config: parseJson(p.config, { version: 1, sections: [] }) };
    if (includeDraft) out.draftConfig = p.draftConfig ? parseJson(p.draftConfig, null) : null;
    else delete out.draftConfig;
    return out;
  }

  /** Global registry of builder blocks (not tenant-scoped). */
  async componentDefinitions() {
    const defs = await this.prisma.componentDefinition.findMany({ orderBy: { category: 'asc' } });
    return defs.map((d) => ({ ...d, propsSchema: parseJson(d.propsSchema, {}), defaults: parseJson(d.defaults, {}) }));
  }

  listPages() {
    return this.prisma.page.findMany({
      where: { tenantId: this.ctx.id },
      select: { id: true, slug: true, title: true, isPublished: true, updatedAt: true },
    });
  }

  async getPage(slug: string, includeDraft = false) {
    const page = await this.prisma.page.findUnique({
      where: { tenantId_slug: { tenantId: this.ctx.id, slug } },
    });
    if (!page) throw new NotFoundException(`Page "${slug}" not found`);
    return this.mapPage(page, includeDraft);
  }

  async upsertPage(slug: string, data: { title?: string; config?: any; draftConfig?: any }) {
    const tenantId = this.ctx.id;
    const page = await this.prisma.page.upsert({
      where: { tenantId_slug: { tenantId, slug } },
      update: {
        ...(data.title ? { title: data.title } : {}),
        ...(data.config ? { config: toJson(data.config) } : {}),
        ...(data.draftConfig !== undefined ? { draftConfig: toJson(data.draftConfig) } : {}),
      },
      create: {
        tenantId,
        slug,
        title: data.title || slug,
        config: toJson(data.config || { version: 1, sections: [] }),
        draftConfig: data.draftConfig !== undefined ? toJson(data.draftConfig) : null,
      },
    });
    return this.mapPage(page, true);
  }

  /** Promote draft layout → published. */
  async publish(slug: string) {
    const page = await this.prisma.page.findUnique({
      where: { tenantId_slug: { tenantId: this.ctx.id, slug } },
    });
    if (!page) throw new NotFoundException(`Page "${slug}" not found`);
    if (!page.draftConfig) return this.mapPage(page, true);
    const updated = await this.prisma.page.update({
      where: { id: page.id },
      data: { config: page.draftConfig, draftConfig: null, isPublished: true },
    });
    return this.mapPage(updated, true);
  }
}
