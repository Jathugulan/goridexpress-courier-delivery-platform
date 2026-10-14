import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  Matches,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Aarav' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  firstName?: string;

  @ApiPropertyOptional({ example: 'Sharma' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  lastName?: string;

  @ApiPropertyOptional({ example: 'aarav@example.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(160)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email?: string;

  @ApiPropertyOptional({ example: '+919876543210' })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9 ()-]{6,24}$/, { message: 'phone must be a valid phone number' })
  phone?: string;
}

export class NotificationPreferencesDto {
  @ApiProperty({ example: true, description: 'Order lifecycle emails and in-app alerts' })
  @IsBoolean()
  orderUpdates: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  paymentUpdates: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  courierUpdates: boolean;

  @ApiProperty({ example: false, description: 'Marketing and promotional notifications' })
  @IsBoolean()
  promotions: boolean;

  @ApiProperty({ example: false, description: 'Weekly summary email' })
  @IsBoolean()
  emailDigest: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  smsAlerts: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  pushAlerts: boolean;
}

export class UpdatePreferencesDto extends PartialType(NotificationPreferencesDto) {
  @ApiPropertyOptional({ example: 'en', enum: ['en', 'hi', 'es', 'fr'] })
  @IsOptional()
  @IsString()
  @IsIn(['en', 'hi', 'es', 'fr'])
  language?: string;

  @ApiPropertyOptional({ example: 'Asia/Kolkata' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string;

  @ApiPropertyOptional({
    example: 'DUMMY_CARD',
    enum: ['DUMMY_CARD', 'DUMMY_WALLET', 'CASH_ON_DELIVERY', 'DUMMY_MOBILE'],
  })
  @IsOptional()
  @IsString()
  defaultPaymentMethod?: string;
}

export class CustomerQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'City or locality the customer operates in' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string;

  @ApiPropertyOptional({ enum: ['true', 'false'] })
  @IsOptional()
  @IsString()
  @IsIn(['true', 'false'])
  isBlocked?: string;

  @ApiPropertyOptional({ enum: ['true', 'false'] })
  @IsOptional()
  @IsString()
  @IsIn(['true', 'false'])
  isVerified?: string;
}

export class BlockCustomerDto {
  @ApiProperty({ example: 'Multiple failed payment attempts' })
  @IsString()
  @IsNotEmpty({ message: 'A reason is required so the customer can be told why' })
  @MaxLength(240)
  reason: string;
}

export class AdminCustomerUpdateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  lastName?: string;

  @ApiPropertyOptional({ example: '+919876543210' })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9 ()-]{6,24}$/)
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  zone?: string;

  @ApiPropertyOptional({ example: '4.8', minimum: 0, maximum: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(5)
  rating?: number;
}
