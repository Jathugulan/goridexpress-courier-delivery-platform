import { SetMetadata, createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { Permission, Role } from '../enums';
import type { AuthUser } from '../types';

export const IS_PUBLIC_KEY = 'isPublic';
export const ROLES_KEY = 'roles';
export const PERMISSIONS_KEY = 'permissions';
export const AUDIT_KEY = 'audit';

/** Skip authentication entirely for this route. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/** Restrict a route to the given roles. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

/** Restrict a route to admins holding the listed permissions. */
const RequiresPermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

/** Restrict a route to admins holding *any* of the listed permissions. */
const RequiresAnyPermission = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

/**
 * Attach audit metadata so high-sensitivity mutations are recorded in
 * `audit_logs` without every controller hand-rolling logging.
 */
export const Audit = (action: string, entity?: string) =>
  SetMetadata(AUDIT_KEY, { action, entity });

/** Injects the authenticated user. */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user?: AuthUser }>();
    const user = request.user;
    if (!user) return undefined;
    return data ? user[data] : user;
  },
);

/** Injects the authenticated user's id, guaranteed present. */
export const UserId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest<{ user?: AuthUser }>();
  return request.user?.id as string;
});

export { RequiresPermissions, RequiresAnyPermission };
