import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContext } from '../../common/tenant-context.service';
import { resolveSettings, isClosedOn } from '../../common/settings';

@Injectable()
export class BookingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: TenantContext,
  ) {}

  // ── Services ──
  listServices(activeOnly = false) {
    return this.prisma.service.findMany({
      where: { tenantId: this.ctx.id, ...(activeOnly ? { isActive: true } : {}) },
      orderBy: { name: 'asc' },
    });
  }

  createService(data: any) {
    return this.prisma.service.create({ data: { ...this.cleanService(data), tenantId: this.ctx.id } });
  }

  async updateService(id: string, data: any) {
    await this.assertOwned(id);
    return this.prisma.service.update({ where: { id }, data: this.cleanService(data) });
  }

  async deleteService(id: string) {
    await this.assertOwned(id);
    return this.prisma.service.delete({ where: { id } });
  }

  private cleanService(d: any) {
    const fields = ['name', 'description', 'imageUrl', 'durationMin', 'priceCents', 'capacity', 'bufferBefore', 'bufferAfter', 'isActive'];
    const out: any = {};
    for (const f of fields) if (d[f] !== undefined) out[f] = d[f];
    return out;
  }

  private async assertOwned(id: string) {
    const s = await this.prisma.service.findFirst({ where: { id, tenantId: this.ctx.id } });
    if (!s) throw new NotFoundException('Service not found');
  }

  // ── Business hours ──
  listHours() {
    return this.prisma.businessHours.findMany({ where: { tenantId: this.ctx.id }, orderBy: { weekday: 'asc' } });
  }

  async saveHours(hours: Array<{ weekday: number; openMin: number; closeMin: number; isClosed: boolean }>) {
    const tenantId = this.ctx.id;
    await Promise.all(
      hours.map((h) =>
        this.prisma.businessHours.upsert({
          where: { tenantId_weekday: { tenantId, weekday: h.weekday } },
          update: { openMin: h.openMin, closeMin: h.closeMin, isClosed: h.isClosed },
          create: { tenantId, weekday: h.weekday, openMin: h.openMin, closeMin: h.closeMin, isClosed: h.isClosed },
        }),
      ),
    );
    return this.listHours();
  }

  // ── Availability ──
  /** Generate bookable slots for a service on a given date (YYYY-MM-DD). */
  async availability(serviceId: string, date: string) {
    const tenantId = this.ctx.id;
    const service = await this.prisma.service.findFirst({ where: { id: serviceId, tenantId } });
    if (!service) throw new NotFoundException('Service not found');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new BadRequestException('date must be YYYY-MM-DD');

    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    const { bookingRules, closures } = resolveSettings(tenant?.settings);

    // Closed on holidays / blackout dates.
    if (isClosedOn(date, closures)) return { date, slots: [], closed: true };

    const day = new Date(`${date}T00:00:00`);
    // Enforce "max days ahead" booking rule.
    const maxDate = new Date();
    maxDate.setHours(0, 0, 0, 0);
    maxDate.setDate(maxDate.getDate() + bookingRules.maxDaysAhead);
    if (day > maxDate) return { date, slots: [] };

    const weekday = day.getDay();
    const hours = await this.prisma.businessHours.findFirst({ where: { tenantId, weekday } });
    if (!hours || hours.isClosed) return { date, slots: [] };

    const dayStart = new Date(`${date}T00:00:00`);
    const dayEnd = new Date(`${date}T23:59:59`);
    const existing = await this.prisma.booking.findMany({
      where: { tenantId, serviceId, status: { not: 'cancelled' }, startsAt: { gte: dayStart, lte: dayEnd } },
    });

    // Slot interval: explicit override or auto (duration + buffers).
    const step = bookingRules.slotIntervalMin > 0 ? bookingRules.slotIntervalMin : service.durationMin + service.bufferBefore + service.bufferAfter;
    const earliest = new Date(Date.now() + bookingRules.leadTimeMinutes * 60000); // lead time
    const slots: Array<{ startsAt: string; endsAt: string; available: boolean }> = [];
    for (let m = hours.openMin; m + service.durationMin <= hours.closeMin; m += step) {
      const start = new Date(day.getTime() + m * 60000);
      const end = new Date(start.getTime() + service.durationMin * 60000);
      const overlapping = existing.filter((b) => b.startsAt < end && b.endsAt > start).length;
      const available = overlapping < service.capacity && start >= earliest;
      slots.push({ startsAt: start.toISOString(), endsAt: end.toISOString(), available });
    }
    return { date, slots };
  }

  // ── Bookings ──
  listBookings() {
    return this.prisma.booking.findMany({
      where: { tenantId: this.ctx.id },
      include: { service: { select: { name: true } } },
      orderBy: { startsAt: 'desc' },
    });
  }

  async createBooking(data: { serviceId: string; customerName: string; customerEmail: string; startsAt: string; notes?: string }) {
    const tenantId = this.ctx.id;
    const service = await this.prisma.service.findFirst({ where: { id: data.serviceId, tenantId } });
    if (!service) throw new NotFoundException('Service not found');

    const start = new Date(data.startsAt);
    const end = new Date(start.getTime() + service.durationMin * 60000);

    // Enforce booking rules server-side (lead time + max days ahead + closures).
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    const { bookingRules, closures } = resolveSettings(tenant?.settings);
    if (isClosedOn(data.startsAt.slice(0, 10), closures)) {
      throw new BadRequestException('De zaak is gesloten op deze datum.');
    }
    if (start.getTime() < Date.now() + bookingRules.leadTimeMinutes * 60000) {
      throw new BadRequestException('Dit tijdstip is te kort dag — kies een later moment.');
    }
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + bookingRules.maxDaysAhead);
    if (start > maxDate) throw new BadRequestException('Dit tijdstip ligt te ver in de toekomst.');

    const overlapping = await this.prisma.booking.count({
      where: { tenantId, serviceId: service.id, status: { not: 'cancelled' }, startsAt: { lt: end }, endsAt: { gt: start } },
    });
    if (overlapping >= service.capacity) throw new BadRequestException('Slot no longer available');

    return this.prisma.booking.create({
      data: {
        tenantId,
        serviceId: service.id,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        startsAt: start,
        endsAt: end,
        notes: data.notes || '',
        status: 'confirmed',
      },
    });
  }

  async updateBookingStatus(id: string, status: string) {
    const b = await this.prisma.booking.findFirst({ where: { id, tenantId: this.ctx.id } });
    if (!b) throw new NotFoundException('Booking not found');
    return this.prisma.booking.update({ where: { id }, data: { status } });
  }

  // ── Customer self-service (look up + cancel own booking) ──
  async findForCustomer(id: string, email: string) {
    const b = await this.prisma.booking.findFirst({
      where: { id, tenantId: this.ctx.id, customerEmail: { equals: (email || '').trim() } },
      include: { service: { select: { name: true } } },
    });
    if (!b) throw new NotFoundException('Geen afspraak gevonden met deze gegevens.');
    return b;
  }

  async cancelByCustomer(id: string, email: string) {
    const b = await this.findForCustomer(id, email);
    if (b.status === 'cancelled') return b;

    const tenant = await this.prisma.tenant.findUnique({ where: { id: this.ctx.id } });
    const { bookingRules } = resolveSettings(tenant?.settings);
    const cutoff = b.startsAt.getTime() - bookingRules.cancellationHours * 3600000;
    if (Date.now() > cutoff) {
      throw new BadRequestException(`Annuleren kan tot ${bookingRules.cancellationHours} uur van tevoren.`);
    }
    return this.prisma.booking.update({ where: { id: b.id }, data: { status: 'cancelled' } });
  }

  // ── Reviews ──
  listReviews() {
    return this.prisma.review.findMany({
      where: { tenantId: this.ctx.id, isApproved: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Coupons ──
  async validateCoupon(code: string) {
    if (!code) return { valid: false, percentOff: 0 };
    const coupon = await this.prisma.coupon.findFirst({
      where: { tenantId: this.ctx.id, code: code.trim().toUpperCase(), isActive: true },
    });
    return coupon ? { valid: true, code: coupon.code, percentOff: coupon.percentOff } : { valid: false, percentOff: 0 };
  }
}
