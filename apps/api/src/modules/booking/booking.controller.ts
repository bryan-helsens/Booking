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
}
