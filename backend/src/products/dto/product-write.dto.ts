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
   registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
} from 'class-validator';

/** Validates that `specifications` JSONB has at most 32 keys and <= 4KB serialized size (SECURITY.md #7). */
function IsBoundedSpecifications(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isBoundedSpecifications',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (value === undefined || value === null) return true;
          if (typeof value !== 'object' || Array.isArray(value)) return false;
          const entries = Object.entries(value as Record<string, unknown>);
          if (entries.length > 32) return false;
          for (const [k, v] of entries) {
            if (k.length > 64) return false;
            const t = typeof v;
            if (t !== 'string' && t !== 'number' && t !== 'boolean') return false;
            if (t === 'string' && (v as string).length > 256) return false;
          }
          return JSON.stringify(value).length <= 4096;
        },
        defaultMessage(_args: ValidationArguments) {
          return 'specifications must be a flat object with at most 32 primitive keys and <= 4KB total';
        },
      },
    });
  };
}

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

  /** Flat key/value technical attributes stored as JSONB (bounded per SECURITY.md #7). */
  @IsOptional() @IsObject() @IsBoundedSpecifications() specifications?: Record<string, string | number | boolean>;

  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}

export class UpdateInventoryDto {
  @Type(() => Number) @IsInt() @Min(0) stockQuantity: number;
}
