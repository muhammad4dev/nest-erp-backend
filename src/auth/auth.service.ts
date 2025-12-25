import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../modules/identity/entities/user.entity';
import { RefreshToken } from '../modules/identity/entities/refresh-token.entity';
import { TenantContext } from '../common/context/tenant.context';
import { wrapTenantRepository } from '../common/repositories/tenant-repository-wrapper';
import * as bcrypt from 'bcrypt';
import { randomBytes, createHash } from 'crypto';

interface JwtPayload {
  email: string;
  sub: string;
  tenantId: string;
  roles?: string[];
}

@Injectable()
export class AuthService {
  private usersRepository: Repository<User>;
  private refreshTokenRepo: Repository<RefreshToken>;

  constructor(
    @InjectRepository(User)
    usersRepositoryBase: Repository<User>,
    @InjectRepository(RefreshToken)
    refreshTokenRepoBase: Repository<RefreshToken>,
    private jwtService: JwtService,
  ) {
    this.usersRepository = wrapTenantRepository(usersRepositoryBase);
    this.refreshTokenRepo = wrapTenantRepository(refreshTokenRepoBase);
  }

  async validateUser(
    email: string,
    pass: string,
  ): Promise<Partial<User> | null> {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) {
      return null;
    }
    const user = await this.usersRepository.findOne({
      where: { email },
      select: ['id', 'email', 'passwordHash', 'tenantId', 'isActive'],
      relations: ['roles'],
    });

    if (!user || !user.isActive) {
      return null;
    }

    const isValid = await bcrypt.compare(pass, user.passwordHash);
    if (isValid) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash: _hash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(
    user: Partial<User>,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const roles = user.roles?.map((r) => r.name) || [];

    const payload: JwtPayload = {
      email: user.email!,
      sub: user.id!,
      tenantId: user.tenantId!,
      roles,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.createRefreshToken(
      user.id!,
      user.tenantId!,
      userAgent,
      ipAddress,
    );

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  private async createRefreshToken(
    userId: string,
    tenantId: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<string> {
    const token = randomBytes(64).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');

    const refreshToken = new RefreshToken();
    refreshToken.userId = userId;
    refreshToken.tenantId = tenantId;
    refreshToken.tokenHash = tokenHash;
    refreshToken.userAgent = userAgent || '';
    refreshToken.ipAddress = ipAddress || '';
    refreshToken.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await this.refreshTokenRepo.save(refreshToken);

    return token;
  }

  async refreshAccessToken(
    refreshToken: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');

    const storedToken = await this.refreshTokenRepo.findOne({
      where: { tokenHash, isRevoked: false },
      relations: ['user', 'user.roles'],
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (new Date() > storedToken.expiresAt) {
      await this.refreshTokenRepo.update(storedToken.id, { isRevoked: true });
      throw new UnauthorizedException('Refresh token expired');
    }

    // Revoke old token (token rotation)
    await this.refreshTokenRepo.update(storedToken.id, { isRevoked: true });

    // Generate new tokens
    return this.login(
      storedToken.user,
      storedToken.userAgent,
      storedToken.ipAddress,
    );
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');

    await this.refreshTokenRepo.update({ tokenHash }, { isRevoked: true });
  }

  async logoutAllDevices(userId: string): Promise<void> {
    await this.refreshTokenRepo.update(
      { userId, isRevoked: false },
      { isRevoked: true },
    );
  }

  async getCurrentUser(userId: string): Promise<Partial<User>> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['roles', 'roles.permissions'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = user;
    return result;
  }
}
