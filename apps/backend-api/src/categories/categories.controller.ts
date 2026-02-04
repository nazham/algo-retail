import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { UniversalAuthGuard } from '../auth/universal-auth.guard';
import { CurrentTenant } from '../auth/current-tenant.decorator';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryQueryDto,
} from './dto/category.dto';

@Controller('categories')
@UseGuards(UniversalAuthGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  findAll(@CurrentTenant() tenantId: string, @Query() query: CategoryQueryDto) {
    return this.categoriesService.findAll(tenantId, query);
  }

  @Post()
  create(
    @CurrentTenant() tenantId: string,
    @Body() createCategoryDto: CreateCategoryDto,
  ) {
    return this.categoriesService.create(tenantId, createCategoryDto);
  }

  @Patch(':id')
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, tenantId, updateCategoryDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    await this.categoriesService.delete(id, tenantId);
  }

  @Get('sync')
  async sync(
    @CurrentTenant() tenantId: string,
    @Query('lastSync') lastSync?: string,
  ) {
    const items = await this.categoriesService.getChangedCategories(
      tenantId,
      lastSync,
    );
    return {
      items,
      serverTime: new Date().toISOString(),
    };
  }
}
