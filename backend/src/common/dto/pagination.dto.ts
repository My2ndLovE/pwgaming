import { IsNumber, Min, Max, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Standard pagination query parameters
 * Used across all list endpoints
 */
export class PaginationDto {
  @ApiProperty({
    description: 'Page number (1-based)',
    minimum: 1,
    default: 1,
    required: false,
    example: 1,
  })
  @IsNumber()
  @Type(() => Number)
  @Min(1, { message: 'page must be a positive integer starting from 1' })
  @IsOptional()
  page: number = 1;

  @ApiProperty({
    description: 'Number of results per page',
    minimum: 1,
    maximum: 100,
    default: 20,
    required: false,
    example: 20,
  })
  @IsNumber()
  @Type(() => Number)
  @Min(1, { message: 'limit must be at least 1' })
  @Max(100, { message: 'limit cannot exceed 100 to prevent abuse' })
  @IsOptional()
  limit: number = 20;
}

/**
 * Pagination metadata returned in responses
 */
export interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Generic paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMetadata;
}

/**
 * Helper function to create consistent paginated responses
 *
 * @param data - Array of items for current page
 * @param total - Total count of all items
 * @param page - Current page number
 * @param limit - Items per page
 * @returns PaginatedResponse with data and pagination metadata
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}
