import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common';
import { SiteService } from './site.service';
import { TenantGuard } from '../../common/tenant.guard';

@Controller()
@UseGuards(TenantGuard)
export class SiteController {
  constructor(private readonly site: SiteService) {}

  @Get('site')
  bootstrap() {
    return this.site.bootstrap();
  }

  @Get('theme')
  getTheme() {
    return this.site.getTheme();
  }

  @Put('theme')
  saveTheme(@Body() body: { tokens: any; mode?: string }) {
    return this.site.saveTheme(body.tokens, body.mode);
  }

  @Put('theme/draft')
  saveThemeDraft(@Body() body: { draft: any; mode?: string }) {
    return this.site.saveThemeDraft(body.draft, body.mode);
  }

  @Post('theme/publish')
  publishTheme() {
    return this.site.publishTheme();
  }

  @Get('content')
  getContent() {
    return this.site.getContent();
  }

  @Put('content')
  saveContent(@Body() body: any) {
    return this.site.saveContent(body);
  }

  @Get('features')
  getFeatures() {
    return this.site.getFeatures();
  }

  @Put('features')
  saveFeatures(@Body() body: Record<string, boolean>) {
    return this.site.saveFeatures(body);
  }
}
