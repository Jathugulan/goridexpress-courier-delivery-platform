import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Role } from '../../common/enums';

/* ------------------------------- Register --------------------------------- */

export class RegisterDto {
  @ApiProperty({ example: 'customer@goridexpress.demo' })
  @IsEmail({}, { message: 'A valid email address is required' })
  @MaxLength(160)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email: string;

  @ApiProperty({
    example: 'Demo@12345',
    minLength: 8,
    description:
      'At least 8 characters with one uppercase letter and one number. Never stored in plain text.',
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(72, { message: 'Password must be at most 72 characters long' })
  @Matches(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
  @Matches(/[0-9]/, { message: 'Password must contain at least one number' })
  password: string;

  @ApiProperty({ example: 'Aarav' })
  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  @MaxLength(60)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  firstName: string;

  @ApiProperty({ example: 'Sharma' })
  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  @MaxLength(60)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  lastName: string;

  @ApiPropertyOptional({ example: '+919876543210' })
  @IsOptional()
  @IsString()
  @MaxLength(24)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  phone?: string;

  @ApiPropertyOptional({
    enum: [Role.CUSTOMER],
    default: Role.CUSTOMER,
    description:
      'Only CUSTOMER self-registration is permitted. ADMIN accounts are provisioned internally.',
  })
  @IsOptional()
  @IsString()
  role?: Role;

  @ApiProperty({
    example: 'Demo@12345',
    description: 'Must match `password`. The server rejects mismatched pairs.',
  })
  @IsString()
  @IsNotEmpty({ message: 'Please confirm your password' })
  @MaxLength(72)
  confirmPassword: string;
}

/* -------------------------------- Login ----------------------------------- */

export class LoginDto {
  @ApiProperty({ example: 'customer@goridexpress.demo' })
  @IsEmail({}, { message: 'A valid email address is required' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email: string;

  @ApiProperty({ example: 'Demo@12345' })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MaxLength(72)
  password: string;

  @ApiPropertyOptional({ description: 'Keep this device signed in for 7 days.' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  rememberMe?: boolean;
}

/* -------------------------------- Refresh --------------------------------- */

export class RefreshTokenDto {
  @ApiPropertyOptional({
    description:
      'Refresh token value. Omit when using the HTTP-only cookie — the server reads the cookie automatically.',
  })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}

/* --------------------------- Password reset ------------------------------- */

export class ForgotPasswordDto {
  @ApiProperty({ example: 'customer@goridexpress.demo' })
  @IsEmail({}, { message: 'A valid email address is required' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'a1b2c3d4e5f6...' })
  @IsString()
  @IsNotEmpty({ message: 'Reset token is required' })
  token: string;

  @ApiProperty({ example: 'NewDemo@12345' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(72)
  @Matches(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
  @Matches(/[0-9]/, { message: 'Password must contain at least one number' })
  password: string;

  @ApiProperty({ example: 'NewDemo@12345' })
  @IsString()
  @IsNotEmpty({ message: 'Please confirm your new password' })
  @MaxLength(72)
  confirmPassword: string;
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'Demo@12345' })
  @IsString()
  @IsNotEmpty({ message: 'Current password is required' })
  @MaxLength(72)
  currentPassword: string;

  @ApiProperty({ example: 'NewDemo@12345' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(72)
  @Matches(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
  @Matches(/[0-9]/, { message: 'Password must contain at least one number' })
  newPassword: string;

  @ApiProperty({ example: 'NewDemo@12345' })
  @IsString()
  @IsNotEmpty({ message: 'Please confirm your new password' })
  @MaxLength(72)
  confirmPassword: string;
}

/* -------------------------------- Sessions -------------------------------- */

export class RevokeAllSessionsDto {
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  keepCurrentSession?: boolean;
}
