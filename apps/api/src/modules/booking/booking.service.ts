import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContext } from '../../common/tenant-context.service';

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
    const fields = ['name', 'description', 'durationMin', 'priceCents', 'capacity', 'bufferBefore', 'bufferAfter', 'isActive'];
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

    const day = new Date(`${date}T00:00:00`);
    const weekday = day.getDay();
    const hours = await this.prisma.businessHours.findFirst({ where: { tenantId, weekday } });
    if (!hours || hours.isClosed) return { date, slots: [] };

    const dayStart = new Date(`${date}T00:00:00`);
    const dayEnd = new Date(`${date}T23:59:59`);
    const existing = await this.prisma.booking.findMany({
      where: { tenantId, serviceId, status: { not: 'cancelled' }, startsAt: { gte: dayStart, lte: dayEnd } },
    });

    const step = service.durationMin + service.bufferBefore + service.bufferAfter;
    const slots: Array<{ startsAt: string; endsAt: string; available: boolean }> = [];
    for (let m = hours.openMin; m + service.durationMin <= hours.closeMin; m += step) {
      const start = new Date(day.getTime() + m * 60000);
      const end = new Date(start.getTime() + service.durationMin * 60000);
      const overlapping = existing.filter((b) => b.startsAt < end && b.endsAt > start).length;
      slots.push({ startsAt: start.toISOString(), endsAt: end.toISOString(), available: overlapping < service.capacity });
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
}
