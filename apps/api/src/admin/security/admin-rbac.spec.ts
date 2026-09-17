import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { UserRole } from '@yatra-seva/shared-types';
import { AdminAuditService } from '../services/admin-audit.service';

describe('Admin Security & RBAC Enforcement', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  function createMockContext(user: any, requiredRoles: UserRole[] = [UserRole.ADMIN]): ExecutionContext {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(requiredRoles);

    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  }

  describe('RolesGuard on Admin Endpoints', () => {
    it('should FORBID access when user is RIDER', () => {
      const context = createMockContext({ userId: 'rider-1', role: UserRole.RIDER });
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should FORBID access when user is DRIVER', () => {
      const context = createMockContext({ userId: 'driver-1', role: UserRole.DRIVER });
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should FORBID access when request has no user (unauthenticated)', () => {
      const context = createMockContext(null);
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should FORBID access when user has missing role', () => {
      const context = createMockContext({ userId: 'anon' });
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should ALLOW access when user has ADMIN role', () => {
      const context = createMockContext({ userId: 'admin-1', role: UserRole.ADMIN });
      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe('Append-Only Audit Log Invariants', () => {
    it('should NOT expose any delete or update methods on AdminAuditService', () => {
      const prototype = AdminAuditService.prototype as any;
      expect(prototype.deleteAuditLog).toBeUndefined();
      expect(prototype.updateAuditLog).toBeUndefined();
      expect(prototype.removeAuditLog).toBeUndefined();
      expect(prototype.purgeAuditLogs).toBeUndefined();
    });
  });
});
