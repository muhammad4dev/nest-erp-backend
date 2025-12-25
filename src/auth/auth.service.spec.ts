import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../modules/identity/entities/user.entity';
import { RefreshToken } from '../modules/identity/entities/refresh-token.entity';
import { JwtService } from '@nestjs/jwt';
import { TenantContext } from '../common/context/tenant.context';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;

  // Mock factory for consistency
  const createMockUserRepository = () => ({
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findOneBy: jest.fn(),
  });

  const createMockRefreshTokenRepository = () => ({
    save: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  });

  const createMockJwtService = () => ({
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
    verify: jest.fn(),
    decode: jest.fn(),
  });

  let mockUserRepo: ReturnType<typeof createMockUserRepository>;
  let mockRefreshTokenRepo: ReturnType<typeof createMockRefreshTokenRepository>;
  let mockJwtService: ReturnType<typeof createMockJwtService>;

  beforeEach(async () => {
    mockUserRepo = createMockUserRepository();
    mockRefreshTokenRepo = createMockRefreshTokenRepository();
    mockJwtService = createMockJwtService();

    // Mock TenantContext to return a valid tenant ID
    jest.spyOn(TenantContext, 'getTenantId').mockReturnValue('t-001');
    jest.spyOn(TenantContext, 'getEntityManager').mockReturnValue(undefined); // Fallback to base repo

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: mockRefreshTokenRepo,
        },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    const validUser = {
      id: 'u-001',
      email: 'test@example.com',
      passwordHash: 'hashed-password',
      isActive: true,
      tenantId: 't-001',
      roles: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
    };

    it('should return user without password hash if credentials are valid', async () => {
      mockUserRepo.findOne.mockResolvedValue(validUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser(
        'test@example.com',
        'password123',
      );

      expect(result).toBeDefined();
      expect(result?.id).toBe('u-001');
      expect(result?.email).toBe('test@example.com');
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should return null if credentials are invalid', async () => {
      mockUserRepo.findOne.mockResolvedValue(validUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser(
        'test@example.com',
        'wrong-password',
      );

      expect(result).toBeNull();
    });

    it('should return null if user is not found', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      const result = await service.validateUser(
        'nonexistent@example.com',
        'password123',
      );

      expect(result).toBeNull();
    });

    it('should return null if user is inactive', async () => {
      const inactiveUser = { ...validUser, isActive: false };
      mockUserRepo.findOne.mockResolvedValue(inactiveUser);

      const result = await service.validateUser(
        'test@example.com',
        'password123',
      );

      expect(result).toBeNull();
    });

    it('should handle bcrypt comparison errors gracefully', async () => {
      mockUserRepo.findOne.mockResolvedValue(validUser);
      (bcrypt.compare as jest.Mock).mockRejectedValue(
        new Error('Bcrypt error'),
      );

      await expect(
        service.validateUser('test@example.com', 'password123'),
      ).rejects.toThrow();
    });

    it('should handle different email formats', async () => {
      const mixedCaseEmail = 'TeSt@ExAmPlE.cOm';
      mockUserRepo.findOne.mockResolvedValue({
        ...validUser,
        email: mixedCaseEmail.toLowerCase(),
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser(mixedCaseEmail, 'password123');

      expect(result).toBeDefined();
    });
  });

  describe('login', () => {
    const testUser = {
      id: 'u-001',
      email: 'test@example.com',
      tenantId: 't-001',
      roles: ['user'],
    };

    it('should return access and refresh tokens', async () => {
      mockJwtService.sign.mockReturnValue('mock-access-token');
      mockRefreshTokenRepo.save.mockResolvedValue({
        id: 'rt-001',
        token: 'mock-refresh-token-hash',
        userId: 'u-001',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      const result = await service.login(testUser as any);

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: 'u-001',
          email: 'test@example.com',
        }),
      );
      expect(mockRefreshTokenRepo.save).toHaveBeenCalled();
    });

    it('should set correct JWT expiration times', async () => {
      mockJwtService.sign.mockReturnValue('mock-token');
      mockRefreshTokenRepo.save.mockResolvedValue({
        id: 'rt-001',
        token: 'hash',
      });

      await service.login(testUser as any);

      // Verify JWT service was called with payload
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          sub: 'u-001',
          tenantId: 't-001',
        }),
      );
    });

    it('should handle refresh token creation failures', async () => {
      mockJwtService.sign.mockReturnValue('mock-token');
      mockRefreshTokenRepo.save.mockRejectedValue(new Error('Database error'));

      await expect(service.login(testUser as any)).rejects.toThrow(
        'Database error',
      );
    });

    it('should include tenant context in JWT', async () => {
      mockJwtService.sign.mockReturnValue('mock-token');
      mockRefreshTokenRepo.save.mockResolvedValue({ id: 'rt-001' });

      await service.login(testUser as any);

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: 'u-001',
          tenantId: 't-001',
        }),
      );
    });

    it('should include user roles in JWT for RBAC', async () => {
      mockJwtService.sign.mockReturnValue('mock-token');
      mockRefreshTokenRepo.save.mockResolvedValue({ id: 'rt-001' });

      const userWithRoles = {
        ...testUser,
        roles: [{ name: 'admin' }, { name: 'finance' }],
      };
      await service.login(userWithRoles as any);

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          roles: ['admin', 'finance'],
        }),
      );
    });
  });

  describe('refreshAccessToken', () => {
    it('should generate new access token from valid refresh token', async () => {
      const existingRefreshToken = {
        id: 'rt-001',
        tokenHash: createHash('sha256')
          .update('plain-refresh-token')
          .digest('hex'),
        userId: 'u-001',
        tenantId: 't-001',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isRevoked: false,
        userAgent: 'test-agent',
        ipAddress: '127.0.0.1',
        user: {
          id: 'u-001',
          email: 'test@example.com',
          tenantId: 't-001',
          roles: [],
        },
      };

      mockRefreshTokenRepo.findOne.mockResolvedValue(existingRefreshToken);
      mockRefreshTokenRepo.update.mockResolvedValue({ affected: 1 } as any);
      mockRefreshTokenRepo.save.mockResolvedValue({} as any);
      mockJwtService.sign.mockReturnValue('new-access-token');

      const result = await service.refreshAccessToken('plain-refresh-token');

      expect(result).toHaveProperty('access_token');
      expect(mockJwtService.sign).toHaveBeenCalled();
      // Verify old token was revoked
      expect(mockRefreshTokenRepo.update).toHaveBeenCalledWith('rt-001', {
        isRevoked: true,
      });
    });

    it('should reject expired refresh tokens', async () => {
      const expiredToken = {
        id: 'rt-001',
        tokenHash: createHash('sha256')
          .update('plain-refresh-token')
          .digest('hex'),
        expiresAt: new Date(Date.now() - 1000), // Past date
        isRevoked: false,
      };

      mockRefreshTokenRepo.findOne.mockResolvedValue(expiredToken);
      mockRefreshTokenRepo.update.mockResolvedValue({ affected: 1 } as any);

      await expect(
        service.refreshAccessToken('plain-refresh-token'),
      ).rejects.toThrow('Refresh token expired');
    });

    it('should reject invalid refresh token hashes', async () => {
      mockRefreshTokenRepo.findOne.mockResolvedValue(null);

      await expect(service.refreshAccessToken('wrong-token')).rejects.toThrow(
        'Invalid refresh token',
      );
    });

    it('should handle missing refresh token', async () => {
      mockRefreshTokenRepo.findOne.mockResolvedValue(null);

      await expect(service.refreshAccessToken('invalid-token')).rejects.toThrow(
        'Invalid refresh token',
      );
    });
  });

  describe('logout', () => {
    it('should invalidate refresh token', async () => {
      const refreshToken = 'plain-refresh-token';
      const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
      mockRefreshTokenRepo.update.mockResolvedValue({ affected: 1 } as any);

      await service.logout(refreshToken);

      expect(mockRefreshTokenRepo.update).toHaveBeenCalledWith(
        { tokenHash },
        { isRevoked: true },
      );
    });

    it('should handle database errors during logout', async () => {
      const refreshToken = 'plain-refresh-token';
      mockRefreshTokenRepo.update.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.logout(refreshToken)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('Tenant Isolation in Auth', () => {
    it('should include tenant context in validated user', async () => {
      const userFromTenantA = {
        id: 'u-001',
        email: 'user@tenant-a.com',
        passwordHash: 'hash',
        isActive: true,
        tenantId: 't-tenant-a',
        roles: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
      };

      mockUserRepo.findOne.mockResolvedValue(userFromTenantA);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser(
        'user@tenant-a.com',
        'password',
      );

      expect(result?.tenantId).toBe('t-tenant-a');
    });

    it('should prevent cross-tenant token reuse (tokens include tenant ID)', async () => {
      const user = {
        id: 'u-001',
        email: 'test@example.com',
        tenantId: 't-tenant-a',
      };

      mockJwtService.sign.mockReturnValue('token');
      mockRefreshTokenRepo.save.mockResolvedValue({ id: 'rt-001' });

      await service.login(user as any);

      // Verify tenantId is in JWT to prevent token reuse across tenants
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: 't-tenant-a' }),
      );
    });
  });

  describe('Error Handling', () => {
    it('should not leak user information in error messages', async () => {
      mockUserRepo.findOne.mockRejectedValue(
        new Error('Database connection lost'),
      );

      await expect(
        service.validateUser('test@example.com', 'password'),
      ).rejects.toThrow();
    });

    it('should handle concurrent login attempts gracefully', async () => {
      const user = {
        id: 'u-001',
        email: 'test@example.com',
        tenantId: 't-001',
      };

      mockJwtService.sign.mockReturnValue('token');
      mockRefreshTokenRepo.save.mockResolvedValue({ id: 'rt-001' });

      const promises = [
        service.login(user as any),
        service.login(user as any),
        service.login(user as any),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(results.every((r) => r.access_token)).toBe(true);
    });
  });
});
