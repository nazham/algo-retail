import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductBulkService } from './product-bulk.service';
import { BulkUploadResultDto } from './dto/bulk-upload.dto';

@Controller('products')
export class ProductBulkController {
  // MVP: Hardcoded tenant ID (will be extracted from JWT in production)
  private MVP_TENANT_ID = '00000000-0000-0000-0000-000000000001';

  constructor(private readonly bulkService: ProductBulkService) {}

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
  ): Promise<BulkUploadResultDto> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      const result = await this.bulkService.bulkImport(
        file.buffer,
        this.MVP_TENANT_ID,
      );
      return result;
    } catch (error) {
      throw new BadRequestException(`CSV upload failed: ${error.message}`);
    }
  }
}
