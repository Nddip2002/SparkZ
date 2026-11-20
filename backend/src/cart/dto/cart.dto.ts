import { Type } from 'class-transformer';
import { IsInt, IsUUID, Max, Min } from 'class-validator';

export const MAX_LINE_QUANTITY = 999;

export class AddToCartDto {
  @IsUUID() productId: string;
  @Type(() => Number) @IsInt() @Min(1) @Max(MAX_LINE_QUANTITY) quantity: number;
}

export class UpdateCartItemDto {
  @Type(() => Number) @IsInt() @Min(1) @Max(MAX_LINE_QUANTITY) quantity: number;
}
