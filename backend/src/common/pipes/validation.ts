import { type ValidationError } from 'class-validator';
import {
  HttpException,
  HttpStatus,
  Injectable,
  type ValidationPipeOptions,
} from '@nestjs/common';
import { ErrorCode } from '../enums';

/** Strips internal Mongo/Mongoose noise so the frontend never sees stack traces. */
const INTERNAL_HINTS = [
  'MongoServerError',
  'E11000',
  'ValidationError:',
  'SchemaObject',
  'CastError',
];

@Injectable()
export class ValidationPipeImpl extends HttpException {
  constructor(errors: ValidationError[]) {
    const flat = flattenValidationErrors(errors);
    super(
      {
        message: 'Validation failed',
        code: ErrorCode.VALIDATION_ERROR,
        errors: flat,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export const validationPipeOptions: ValidationPipeOptions = {
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  transformOptions: { enableImplicitConversion: false },
  stopAtFirstError: false,
  validationError: { target: false, value: false },
  exceptionFactory: (errors: ValidationError[]) => new ValidationPipeImpl(errors),
};

function flattenValidationErrors(
  errors: ValidationError[],
  parentPath = '',
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const error of errors) {
    const path = parentPath ? `${parentPath}.${error.property}` : error.property;

    if (error.constraints) {
      const raw = Object.values(error.constraints)[0] ?? 'Invalid value';
      result[path] = sanitize(raw);
    }

    if (error.children?.length) {
      Object.assign(result, flattenValidationErrors(error.children, path));
    }
  }

  return result;
}

function sanitize(message: string): string {
  let output = message;
  for (const hint of INTERNAL_HINTS) {
    output = output.split(hint).join('');
  }
  return output.trim() || 'Invalid value';
}
