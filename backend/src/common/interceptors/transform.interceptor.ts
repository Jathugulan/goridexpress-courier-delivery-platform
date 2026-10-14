import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { ApiResponse } from '../dto/api-response.dto';
import type { PaginationMeta } from '../types';

interface RawSuccess<T> {
  data: T;
  message?: string;
  pagination?: PaginationMeta;
}

/**
 * Wraps every controller return value in the canonical success envelope, unless
 * the controller already returned an `ApiResponse`.
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<unknown>> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponse<unknown>> {
    const request = context.switchToHttp().getRequest<{ url: string; originalUrl: string }>();
    const path = request.originalUrl?.split('?')[0];

    return next.handle().pipe(
      map((payload: T) => {
        if (payload instanceof ApiResponse) return payload as ApiResponse<unknown>;
        if (payload === undefined || payload === null) return ApiResponse.empty('Success', path);

        if (this.isRawSuccess(payload)) {
          const raw = payload as unknown as RawSuccess<unknown>;
          if (raw.pagination) {
            const items = Array.isArray(raw.data) ? raw.data : [raw.data];
            return ApiResponse.list(items, raw.pagination, raw.message ?? 'Success', path);
          }
          return ApiResponse.ok(raw.data, raw.message ?? 'Success', path);
        }

        return ApiResponse.ok(payload, 'Success', path);
      }),
    );
  }

  /** Detects the `{ data, message?, pagination? }` shorthand used in controllers. */
  private isRawSuccess(value: unknown): boolean {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
    const keys = Object.keys(value);
    if (!keys.includes('data')) return false;
    // Only treat as shorthand when it is a small, known shape.
    return keys.every((k) => k === 'data' || k === 'message' || k === 'pagination');
  }
}
