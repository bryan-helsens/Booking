import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { PagesService } from './pages.service';
import { TenantGuard } from '../../common/tenant.guard';

@Controller()
@UseGuards(TenantGuard)
export class PagesController {
  constructor(private readonly pages: PagesService) {}

  @Get('components')
  components() {
    return this.pages.componentDefinitions();
  }

  @Get('pages')
  list() {
    return this.pages.listPages();
  }

  @Get('pages/:slug')
  get(@Param('slug') slug: string, @Query('draft') draft?: string) {
    return this.pages.getPage(slug, draft === 'true');
  }

  @Put('pages/:slug')
  upsert(@Param('slug') slug: string, @Body() body: { title?: string; config?: any; draftConfig?: any }) {
    return this.pages.upsertPage(slug, body);
  }

  @Post('pages/:slug/publish')
  publish(@Param('slug') slug: string) {
    return this.pages.publish(slug);
  }
}
