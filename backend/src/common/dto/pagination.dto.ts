import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export const MAX_PAGE_SIZE = 100;
export const DEFAULT_PAGE_SIZE = 10;

/**
 * Serializable pagination metadata.
 *
 * Declared as a class (not an interface) so `@nestjs/swagger` can reflect it
 * into the OpenAPI schema at runtime.
 */
export class PaginationMeta {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 42 })
  total: number;

  @ApiProperty({ example: 5 })
  totalPages: number;

  @ApiProperty({ example: true })
  hasNext: boolean;

  @ApiProperty({ example: false })
  hasPrevious: boolean;

  constructor(init?: Partial<PaginationMeta>) {
    this.page = init?.page ?? 1;
    this.limit = init?.limit ?? DEFAULT_PAGE_SIZE;
    this.total = init?.total ?? 0;
    this.totalPages = init?.totalPages ?? 1;
    this.hasNext = init?.hasNext ?? false;
    this.hasPrevious = init?.hasPrevious ?? false;
  }
}

/** Base class for every `?page=&limit=` list endpoint. */
export class PaginationQueryDto {
  @ApiPropertyOptional({ minimum: 1, default: 1, example: 1 })
  @Type(() => Number)
  @IsInt({ message: 'page must be an integer' })
  @Min(1)
  @IsOptional()
  page: number = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: MAX_PAGE_SIZE, default: DEFAULT_PAGE_SIZE })
  @Type(() => Number)
  @IsInt({ message: 'limit must be an integer' })
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  @IsOptional()
  limit: number = DEFAULT_PAGE_SIZE;

  @ApiPropertyOptional({ description: 'Field to sort by. Prefix with `-` for descending.' })
  @IsString()
  @MaxLength(40)
  @IsOptional()
  sort?: string;

  @ApiPropertyOptional({ description: 'Free-text search term.' })
  @IsString()
  @MaxLength(120)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  search?: string;

  get skip(): number {
    return (this.page - 1) * this.limit;
  }

  get take(): number {
    return this.limit;
  }
}
