import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @IsString() @IsNotEmpty() @MaxLength(64) sku: string;
  @IsString() @IsNotEmpty() @MaxLength(64) mpn: string;
  @IsString() @IsNotEmpty() @MaxLength(80) category: string;
  @IsOptional() @IsString() @MaxLength(80) subcategory?: string;
  @IsString() @IsNotEmpty() @MaxLength(80) manufacturer: string;
  @IsString() @IsNotEmpty() @MaxLength(200) name: string;

  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'slug must be lowercase kebab-case' })
  @MaxLength(200)
  slug: string;

  @IsString() @MaxLength(10_000) description: string;

  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) unitPrice: number;
  @Type(() => Number) @IsInt() @Min(0) stockQuantity: number;

  @IsOptional() @ArrayMaxSize(10) @IsUrl({}, { each: true }) imageUrls?: string[];
  @IsOptional() @IsUrl() datasheetUrl?: string;

  /** Flat key/value technical attributes stored as JSONB. */
  @IsOptional() @IsObject() specifications?: Record<string, string | number | boolean>;

  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}

export class UpdateInventoryDto {
  @Type(() => Number) @IsInt() @Min(0) stockQuantity: number;
}
