import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { IsEnum, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthUser } from '../auth/auth.types.js';
import { AccountType } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';

/** Self-service profile fields. `role` is intentionally absent — it can never be set by clients. */
export class UpdateProfileDto {
  @IsOptional() @IsString() @MaxLength(120) fullName?: string;
  @IsOptional() @Matches(/^\+?[0-9\s-]{7,20}$/, { message: 'phone must be a valid phone number' }) phone?: string;
  @IsOptional() @IsEnum(AccountType) accountType?: AccountType;
}

const profileSelect = {
  id: true,
  email: true,
  fullName: true,
  phone: true,
  role: true,
  accountType: true,
  createdAt: true,
} as const;

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('me')
  async me(@CurrentUser() user: AuthUser) {
    const profile = await this.prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: profileSelect });
    // Reflect the effective (possibly app_metadata-elevated) role resolved by the guard.
    return { ...profile, role: user.role };
  }

  @Patch('me')
  async update(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    const profile = await this.prisma.user.update({ where: { id: user.id }, data: dto, select: profileSelect });
    return { ...profile, role: user.role };
  }
}
