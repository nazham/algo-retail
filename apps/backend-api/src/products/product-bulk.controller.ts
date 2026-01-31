import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  HttpCode,
  HttpStatus,
  UseGuards,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductBulkService } from './product-bulk.service';
import { BulkUploadResultDto } from './dto/bulk-upload.dto';
import { UniversalAuthGuard } from 'src/auth/universal-auth.guard';
import { CurrentTenant } from 'src/auth/current-tenant.decorator';

@Controller('products')
@UseGuards(UniversalAuthGuard)
export class ProductBulkController {
  constructor(private readonly bulkService: ProductBulkService) {}

  @Post('bulk-batch')
  @HttpCode(HttpStatus.OK)
  async bulkUploadBatch(
    @Body() body: { items: any[] },
    @CurrentTenant() tenantId: string,
  ): Promise<BulkUploadResultDto> {
    if (!body.items || !Array.isArray(body.items)) {
      throw new BadRequestException(
        'Invalid batch format. Expected { items: [] }',
      );
    }

    try {
      return await this.bulkService.processBatch(body.items, tenantId);
    } catch (error) {
      throw new BadRequestException(
        `Batch processing failed: ${error.message}`,
      );
    }
  }

  @Post('bulk')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
      },
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(csv)$/)) {
          return cb(
            new BadRequestException('Only CSV files are allowed'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async bulkUpload(
    @UploadedFile() file: Express.Multer.File,
    @CurrentTenant() tenantId: string,
  ): Promise<BulkUploadResultDto> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      const result = await this.bulkService.bulkImport(file.buffer, tenantId);
      return result;
    } catch (error) {
      throw new BadRequestException(`CSV upload failed: ${error.message}`);
    }
  }
}
