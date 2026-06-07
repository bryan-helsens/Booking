import { Controller, Post, Req, UploadedFile, UseGuards, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { TenantGuard } from '../../common/tenant.guard';
import { MediaService } from './media.service';

@Controller('media')
@UseGuards(TenantGuard)
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      // In-memory so the service can route the buffer to S3 or disk.
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
      fileFilter: (_req, file, cb) => cb(null, file.mimetype.startsWith('image/')),
    }),
  )
  async upload(@UploadedFile() file: any, @Req() req: Request) {
    if (!file) throw new BadRequestException('No image file uploaded');
    const origin = `${req.protocol}://${req.get('host')}`;
    const url = await this.media.store(file, origin);
    return { url };
  }
}
