import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, ValidateNested } from 'class-validator';
import { OrderStatus } from '../../generated/prisma/enums.js';

export class ShippingAddressDto {
  @IsString() @IsNotEmpty() @MaxLength(120) fullName: string;
  @IsString() @Matches(/^\+?[0-9\s-]{7,20}$/, { message: 'phone must be a valid phone number' }) phone: string;
  @IsString() @IsNotEmpty() @MaxLength(200) line1: string;
  @IsOptional() @IsString() @MaxLength(200) line2?: string;
  @IsString() @IsNotEmpty() @MaxLength(100) city: string;
  @IsString() @IsNotEmpty() @MaxLength(100) state: string;
  @IsString() @Matches(/^[A-Za-z0-9\s-]{3,12}$/, { message: 'postalCode is invalid' }) postalCode: string;
  @IsString() @IsNotEmpty() @MaxLength(80) country: string;
}

export class CheckoutDto {
  @ValidateNested() @Type(() => ShippingAddressDto) shippingAddress: ShippingAddressDto;
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus) status: OrderStatus;
}
