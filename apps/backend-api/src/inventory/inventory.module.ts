import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { DatabaseModule } from '../db/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService], // Export for use in OrdersModule
})
export class InventoryModule {}
