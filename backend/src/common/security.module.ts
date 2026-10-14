import { Global, Module } from '@nestjs/common';
import { SessionStateService } from './session-state.service';

/**
 * Global so authentication-adjacent services (guards, the realtime gateway,
 * token rotation) can all verify session liveness without re-importing a module.
 */
@Global()
@Module({
  providers: [SessionStateService],
  exports: [SessionStateService],
})
export class SecurityModule {}
