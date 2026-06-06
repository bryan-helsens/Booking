import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { BookingService } from './booking.service';
import { TenantGuard } from '../../common/tenant.guard';

@Controller()
@UseGuards(TenantGuard)
export class BookingController {
  constructor(private readonly booking: BookingService) {}

  // Services
  @Get('services')
  listServices(@Query('active') active?: string) {
    return this.booking.listServices(active === 'true');
  }

  @Post('services')
  createService(@Body() body: any) {
    return this.booking.createService(body);
  }

  @Put('services/:id')
  updateService(@Param('id') id: string, @Body() body: any) {
    return this.booking.updateService(id, body);
  }

  @Delete('services/:id')
  deleteService(@Param('id') id: string) {
    return this.booking.deleteService(id);
  }

  // Business hours
  @Get('business-hours')
  listHours() {
    return this.booking.listHours();
  }

  @Put('business-hours')
  saveHours(@Body() body: any[]) {
    return this.booking.saveHours(body);
  }

  // Availability
  @Get('availability')
  availability(@Query('serviceId') serviceId: string, @Query('date') date: string) {
    return this.booking.availability(serviceId, date);
  }

  // Bookings
  @Get('bookings')
  listBookings() {
    return this.booking.listBookings();
  }

  @Post('bookings')
  createBooking(@Body() body: any) {
    return this.booking.createBooking(body);
  }

  @Patch('bookings/:id')
  updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.booking.updateBookingStatus(id, body.status);
  }

  // Customer self-service: look up + cancel own booking (verified by email).
  @Get('my-booking/:id')
  findForCustomer(@Param('id') id: string, @Query('email') email: string) {
    return this.booking.findForCustomer(id, email);
  }

  @Post('my-booking/:id/cancel')
  cancelByCustomer(@Param('id') id: string, @Body() body: { email: string }) {
    return this.booking.cancelByCustomer(id, body.email);
  }

  @Get('reviews')
  listReviews() {
    return this.booking.listReviews();
  }

  @Get('coupons/validate')
  validateCoupon(@Query('code') code: string) {
    return this.booking.validateCoupon(code);
  }
}
