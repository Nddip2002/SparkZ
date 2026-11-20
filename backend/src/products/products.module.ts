import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller.js';
import { AdminProductsController } from './admin-products.controller.js';
import { ProductsService } from './products.service.js';
import { CatalogCacheService } from './catalog-cache.service.js';

@Module({
  controllers: [ProductsController, AdminProductsController],
  providers: [ProductsService, CatalogCacheService],
  exports: [CatalogCacheService],
})
export class ProductsModule {}
