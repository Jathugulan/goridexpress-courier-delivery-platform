import { Global, Module } from '@nestjs/common';
import { AuditService } from './audit.service';

/**
 * Global so any module can record a sensitive mutation without importing an
 * audit dependency. `AuditService` is a single shared writer; making it global
 * keeps one cache and one connection-scoped model reference.
 */
@Global()
@Module({
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
