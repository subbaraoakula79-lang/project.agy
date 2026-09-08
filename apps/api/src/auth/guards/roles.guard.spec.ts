import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@yatra-seva/shared-types';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  const createMockContext = (userRole?: UserRole): ExecutionContext =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          user: userRole ? { userId: 'test-user', role: userRole } : undefined,
        }),
      }),
    } as unknown as ExecutionContext);

  it('should allow access if no roles are required on route', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = createMockContext(UserRole.RIDER);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('RIDER → rider endpoint = allowed', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.RIDER]);
    const context = createMockContext(UserRole.RIDER);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('RIDER → driver endpoint = rejected (403)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.DRIVER]);
    const context = createMockContext(UserRole.RIDER);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('RIDER → admin endpoint = rejected (403)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
    const context = createMockContext(UserRole.RIDER);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('DRIVER → driver endpoint = allowed', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.DRIVER]);
    const context = createMockContext(UserRole.DRIVER);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('DRIVER → admin endpoint = rejected (403)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
    const context = createMockContext(UserRole.DRIVER);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('ADMIN → admin endpoint = allowed', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
    const context = createMockContext(UserRole.ADMIN);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('Unauthenticated user → protected endpoint = rejected (403)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.RIDER]);
    const context = createMockContext(undefined);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
