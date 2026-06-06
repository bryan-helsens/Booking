import { Controller, Post, Req, UploadedFile, UseGuards, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { Request } from 'express';
import { TenantGuard } from '../../common/tenant.guard';

const UPLOAD_DIR = join(process.cwd(), 'uploads');
if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });

@Controller('media')
@UseGuards(TenantGuard)
export class MediaController {
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: UPLOAD_DIR,
        filename: (_req, file, cb) => {
          const safe = `${Date.now()}-${Math.round(Math.random() * 1e6)}${extname(file.originalname)}`;
          cb(null, safe);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
      fileFilter: (_req, file, cb) => cb(null, file.mimetype.startsWith('image/')),
    }),
  )
  upload(@UploadedFile() file: any, @Req() req: Request) {
    if (!file) throw new BadRequestException('No image file uploaded');
    // Absolute URL so it resolves correctly from a separately-hosted frontend.
    const url = `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
    return { url };
  }
}
