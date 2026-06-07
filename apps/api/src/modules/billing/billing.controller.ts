import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { BillingService } from './billing.service';
import { TenantGuard } from '../../common/tenant.guard';

@Controller('billing')
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Get()
  @UseGuards(TenantGuard)
  get() {
    return this.billing.get();
  }

  @Post('checkout')
  @UseGuards(TenantGuard)
  checkout(@Body() body: { plan: string }, @Req() req: Request) {
    return this.billing.checkout(body.plan, `${req.protocol}://${req.get('host')}`);
  }

  @Post('downgrade')
  @UseGuards(TenantGuard)
  downgrade() {
    return this.billing.downgradeToFree();
  }

  @Post('portal')
  @UseGuards(TenantGuard)
  portal(@Req() req: Request) {
    return this.billing.portal(`${req.protocol}://${req.get('host')}`);
  }

  // Stripe webhook — no tenant guard; verified by signature instead.
  @Post('webhook')
  webhook(@Req() req: Request & { rawBody?: Buffer }) {
    return this.billing.handleWebhook(req.rawBody as Buffer, req.headers['stripe-signature'] as string);
  }
}
