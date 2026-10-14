import { type ArgumentsHost, Catch, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { type Request, type Response } from 'express';
import { ErrorCode } from '../enums';

interface MongooseDuplicateKeyError extends Error {
  code: number;
  keyValue?: Record<string, unknown>;
}

@Catch()
export class AllExceptionsFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'An unexpected error occurred';
    let code: ErrorCode = ErrorCode.INTERNAL_ERROR;
    let errors: Record<string, string> | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else if (body && typeof body === 'object') {
        const payload = body as { message?: string | string[]; code?: ErrorCode; errors?: Record<string, string> };
        message = Array.isArray(payload.message)
          ? payload.message.join(', ')
          : (payload.message ?? message);
        code = payload.code ?? this.codeForStatus(status);
        errors = payload.errors;
      }
    } else if (this.isDuplicateKeyError(exception)) {
      status = HttpStatus.CONFLICT;
      code = ErrorCode.DUPLICATE_RESOURCE;
      const field = Object.keys((exception as MongooseDuplicateKeyError).keyValue ?? {})[0];
      message = field
        ? `A record with this ${field} already exists`
        : 'A record with these details already exists';
    } else if (exception instanceof Error) {
      // An unhandled error reaching here is a bug, not a client mistake. Its
      // message can contain file paths, connection strings or query fragments,
      // so it is logged with a stack and never returned to the caller.
      message = 'An unexpected error occurred';
    }

    // body-parser / JSON syntax failures expose parser internals and offsets.
    if (this.isBodyParserError(exception)) {
      status = HttpStatus.BAD_REQUEST;
      code = ErrorCode.BAD_REQUEST;
      message =
        (exception as { type: string }).type === 'entity.too.large'
          ? 'Request body is too large'
          : 'Malformed request body';
    }

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.originalUrl} -> ${status}: ${exception instanceof Error ? exception.message : String(exception)}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(`${request.method} ${request.originalUrl} -> ${status}: ${message}`);
    }

    response.status(status).json({
      success: false,
      message,
      code,
      timestamp: new Date().toISOString(),
      path: request.originalUrl?.split('?')[0],
      ...(errors ? { errors } : {}),
    });
  }

  private isDuplicateKeyError(error: unknown): error is MongooseDuplicateKeyError {
    return (
      error instanceof Error &&
      (error as MongooseDuplicateKeyError).code === 11000
    );
  }

  /** body-parser tags its errors with a `type` starting `entity.`. */
  private isBodyParserError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;
    const type = (error as { type?: string }).type;
    return typeof type === 'string' && type.startsWith('entity.');
  }

  private codeForStatus(status: number): ErrorCode {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return ErrorCode.BAD_REQUEST;
      case HttpStatus.UNAUTHORIZED:
        return ErrorCode.UNAUTHORIZED;
      case HttpStatus.FORBIDDEN:
        return ErrorCode.FORBIDDEN;
      case HttpStatus.NOT_FOUND:
        return ErrorCode.NOT_FOUND;
      case HttpStatus.CONFLICT:
        return ErrorCode.CONFLICT;
      case HttpStatus.TOO_MANY_REQUESTS:
        return ErrorCode.TOO_MANY_REQUESTS;
      case HttpStatus.NOT_IMPLEMENTED:
        return ErrorCode.NOT_IMPLEMENTED;
      case HttpStatus.SERVICE_UNAVAILABLE:
        return ErrorCode.SERVICE_UNAVAILABLE;
      default:
        return status >= 500 ? ErrorCode.INTERNAL_ERROR : ErrorCode.BAD_REQUEST;
    }
  }
}
