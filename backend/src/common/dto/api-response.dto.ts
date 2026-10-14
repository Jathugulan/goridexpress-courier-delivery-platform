import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ErrorCode } from '../enums';
import { PaginationMeta } from './pagination.dto';

/**
 * Canonical success envelope. Every 2xx response from this API uses this shape
 * so the frontend can rely on a single unwrapping path.
 */
export class ApiResponse<T> {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Operation completed successfully' })
  message: string;

  @ApiPropertyOptional({ description: 'Payload. Shape depends on the endpoint.' })
  data?: T;

  @ApiPropertyOptional({ type: PaginationMeta, description: 'Present on list endpoints.' })
  pagination?: PaginationMeta;

  @ApiPropertyOptional({ example: '2026-01-01T00:00:00.000Z' })
  timestamp: string;

  @ApiPropertyOptional({ example: '/api/v1/orders' })
  path?: string;

  constructor(init: {
    success?: boolean;
    message: string;
    data?: T;
    pagination?: PaginationMeta;
    timestamp?: string;
    path?: string;
  }) {
    this.success = init.success ?? true;
    this.message = init.message;
    this.data = init.data;
    this.pagination = init.pagination;
    this.timestamp = init.timestamp ?? new Date().toISOString();
    this.path = init.path;
  }

  static ok<T>(data: T, message = 'Success', path?: string): ApiResponse<T> {
    return new ApiResponse<T>({ success: true, message, data, path });
  }

  static list<T>(data: T[], pagination: PaginationMeta, message = 'Success', path?: string) {
    return new ApiResponse<T[]>({ success: true, message, data, pagination, path });
  }

  static empty(message = 'Success', path?: string): ApiResponse<null> {
    return new ApiResponse<null>({ success: true, message, data: null, path });
  }
}

/** Canonical error envelope. */
export class ApiErrorResponse {
  @ApiProperty({ example: false })
  success: boolean = false;

  @ApiProperty({ example: 'Validation failed' })
  message: string;

  @ApiProperty({ example: ErrorCode.VALIDATION_ERROR })
  code: ErrorCode;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/api/v1/orders' })
  path: string;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: { type: 'string' },
    example: { email: 'email must be a valid email address' },
  })
  errors?: Record<string, string>;
}
