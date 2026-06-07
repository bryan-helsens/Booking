import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContext } from '../../common/tenant-context.service';
import { resolveSettings, isClosedOn } from '../../common/settings';
import { planById } from '../../common/plans';

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

  async createService(data: any) {
    await this.assertWithinPlanLimit('services');
    return this.prisma.service.create({ data: { ...this.cleanService(data), tenantId: this.ctx.id } });
  }

  /** Enforce the subscription plan's limit on services / staff. */
  private async assertWithinPlanLimit(kind: 'services' | 'staff') {
    const tenantId = this.ctx.id;
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    const limit = planById(tenant?.plan).limits[kind];
    const count =
      kind === 'services'
        ? await this.prisma.service.count({ where: { tenantId } })
        : await this.prisma.staffMember.count({ where: { tenantId } });
    if (count >= limit) {
      const noun = kind === 'services' ? 'diensten' : 'medewerkers';
      throw new BadRequestException(`Je limiet van ${limit} ${noun} is bereikt op het ${planById(tenant?.plan).label}-plan. Upgrade je abonnement om er meer toe te voegen.`);
    }
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

  // ── Staff ──
  listStaff(activeOnly = false) {
    return this.prisma.staffMember.findMany({
      where: { tenantId: this.ctx.id, ...(activeOnly ? { isActive: true } : {}) },
      include: { services: { select: { id: true } } },
      orderBy: { name: 'asc' },
    });
  }

  /** Active staff that can perform a given service (for the booking picker). */
  async staffForService(serviceId: string) {
    const service = await this.prisma.service.findFirst({
      where: { id: serviceId, tenantId: this.ctx.id },
      include: { staff: { where: { isActive: true }, orderBy: { name: 'asc' } } },
    });
    return service?.staff ?? [];
  }

  async createStaff(data: any) {
    await this.assertWithinPlanLimit('staff');
    return this.prisma.staffMember.create({
      data: {
        tenantId: this.ctx.id,
        name: data.name,
        title: data.title || '',
        imageUrl: data.imageUrl || '',
        isActive: data.isActive ?? true,
        services: { connect: (data.serviceIds || []).map((id: string) => ({ id })) },
      },
    });
  }

  async updateStaff(id: string, data: any) {
    await this.assertStaffOwned(id);
    return this.prisma.staffMember.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        ...(data.serviceIds ? { services: { set: data.serviceIds.map((sid: string) => ({ id: sid })) } } : {}),
      },
    });
  }

  async deleteStaff(id: string) {
    await this.assertStaffOwned(id);
    return this.prisma.staffMember.delete({ where: { id } });
  }

  private async assertStaffOwned(id: string) {
    const s = await this.prisma.staffMember.findFirst({ where: { id, tenantId: this.ctx.id } });
    if (!s) throw new NotFoundException('Staff member not found');
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
  async availability(serviceId: string, date: string, staffId?: string) {
    const tenantId = this.ctx.id;
    const service = await this.prisma.service.findFirst({
      where: { id: serviceId, tenantId },
      include: { staff: { where: { isActive: true }, select: { id: true } } },
    });
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

    // Staff dimension: candidate staff = a specific one, or all active staff
    // for the service. If the service has no staff, fall back to capacity.
    const allStaff = service.staff.map((s) => s.id);
    const candidates = staffId ? allStaff.filter((id) => id === staffId) : allStaff;
    const useStaff = candidates.length > 0;

    const step = bookingRules.slotIntervalMin > 0 ? bookingRules.slotIntervalMin : service.durationMin + service.bufferBefore + service.bufferAfter;
    const earliest = new Date(Date.now() + bookingRules.leadTimeMinutes * 60000); // lead time
    const slots: Array<{ startsAt: string; endsAt: string; available: boolean }> = [];
    for (let m = hours.openMin; m + service.durationMin <= hours.closeMin; m += step) {
      const start = new Date(day.getTime() + m * 60000);
      const end = new Date(start.getTime() + service.durationMin * 60000);
      const overlap = existing.filter((b) => b.startsAt < end && b.endsAt > start);
      let available: boolean;
      if (useStaff) {
        // Free if at least one candidate staff member has no overlapping booking.
        const busy = new Set(overlap.map((b) => b.staffId).filter(Boolean) as string[]);
        available = candidates.some((id) => !busy.has(id));
      } else {
        available = overlap.length < service.capacity;
      }
      slots.push({ startsAt: start.toISOString(), endsAt: end.toISOString(), available: available && start >= earliest });
    }
    return { date, slots };
  }

  // ── Bookings ──
  listBookings() {
    return this.prisma.booking.findMany({
      where: { tenantId: this.ctx.id },
      include: { service: { select: { name: true } }, staff: { select: { name: true } } },
      orderBy: { startsAt: 'desc' },
    });
  }

  async createBooking(data: { serviceId: string; customerName: string; customerEmail: string; startsAt: string; notes?: string; staffId?: string }) {
    const tenantId = this.ctx.id;
    const service = await this.prisma.service.findFirst({
      where: { id: data.serviceId, tenantId },
      include: { staff: { where: { isActive: true }, select: { id: true } } },
    });
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

    const overlap = await this.prisma.booking.findMany({
      where: { tenantId, serviceId: service.id, status: { not: 'cancelled' }, startsAt: { lt: end }, endsAt: { gt: start } },
    });

    // Resolve which staff member handles this booking.
    const staffIds = service.staff.map((s) => s.id);
    let assignedStaffId: string | null = null;
    if (staffIds.length) {
      const busy = new Set(overlap.map((b) => b.staffId).filter(Boolean) as string[]);
      if (data.staffId) {
        if (!staffIds.includes(data.staffId)) throw new BadRequestException('Deze medewerker doet deze dienst niet.');
        if (busy.has(data.staffId)) throw new BadRequestException('Deze medewerker is niet meer beschikbaar.');
        assignedStaffId = data.staffId;
      } else {
        // Round-robin-ish: pick the first free qualified staff member.
        assignedStaffId = staffIds.find((id) => !busy.has(id)) ?? null;
        if (!assignedStaffId) throw new BadRequestException('Slot no longer available');
      }
    } else if (overlap.length >= service.capacity) {
      throw new BadRequestException('Slot no longer available');
    }

    return this.prisma.booking.create({
      data: {
        tenantId,
        serviceId: service.id,
        staffId: assignedStaffId,
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

  // ── Analytics ──
  async analytics() {
    const tenantId = this.ctx.id;
    const bookings = await this.prisma.booking.findMany({
      where: { tenantId },
      include: { service: { select: { id: true, name: true, priceCents: true } }, staff: { select: { id: true, name: true } } },
    });
    const now = Date.now();
    const active = bookings.filter((b) => b.status !== 'cancelled');
    const completed = active.filter((b) => b.startsAt.getTime() < now);
    const revenueCents = active.reduce((sum, b) => sum + (b.service?.priceCents || 0), 0);

    // Group active bookings, summing count + revenue, keyed by id.
    const group = (key: (b: (typeof bookings)[number]) => { id: string; name: string } | null) => {
      const m = new Map<string, { id: string; name: string; count: number; revenueCents: number }>();
      for (const b of active) {
        const k = key(b);
        if (!k) continue;
        const cur = m.get(k.id) || { id: k.id, name: k.name, count: 0, revenueCents: 0 };
        cur.count += 1;
        cur.revenueCents += b.service?.priceCents || 0;
        m.set(k.id, cur);
      }
      return [...m.values()].sort((a, b) => b.count - a.count);
    };

    // Bookings per day for the last 14 days (by appointment date).
    const days: Array<{ date: string; count: number }> = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const count = active.filter((b) => b.startsAt.toISOString().slice(0, 10) === key).length;
      days.push({ date: key, count });
    }

    return {
      totalBookings: bookings.length,
      activeBookings: active.length,
      completed: completed.length,
      upcoming: active.filter((b) => b.startsAt.getTime() > now).length,
      cancelled: bookings.length - active.length,
      cancelRate: bookings.length ? Math.round(((bookings.length - active.length) / bookings.length) * 100) : 0,
      revenueCents,
      avgValueCents: active.length ? Math.round(revenueCents / active.length) : 0,
      perService: group((b) => (b.service ? { id: b.service.id, name: b.service.name } : null)),
      perStaff: group((b) => (b.staff ? { id: b.staff.id, name: b.staff.name } : null)),
      last14Days: days,
    };
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
