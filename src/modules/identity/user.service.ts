import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import {
  CreateUserDto,
  UpdateUserDto,
  ChangePasswordDto,
} from './dto/user.dto';
import * as bcrypt from 'bcrypt';
import { hashPassword } from '../../common/security/password.util';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Role)
    private roleRepo: Repository<Role>,
  ) {}

  async create(dto: CreateUserDto, currentUserTenantId: string): Promise<User> {
    const existing = await this.userRepo.findOne({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await hashPassword(dto.password);

    const user = this.userRepo.create({
      email: dto.email,
      passwordHash,
      tenantId: dto.tenantId || currentUserTenantId,
      isActive: true,
    });

    await this.userRepo.save(user);

    // Remove sensitive data before returning
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...result } = user;
    return result as User;
  }

  async findAll(): Promise<Partial<User>[]> {
    const users = await this.userRepo.find({
      relations: ['roles'],
    });

    return users.map((user) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, ...result } = user;
      return result;
    });
  }

  async findOne(id: string): Promise<Partial<User>> {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ['roles', 'roles.permissions'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = user;
    return result;
  }

  async update(id: string, dto: UpdateUserDto): Promise<Partial<User>> {
    const user = await this.userRepo.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    Object.assign(user, dto);
    await this.userRepo.save(user);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = user;
    return result;
  }

  async changePassword(
    id: string,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({
      where: { id },
      select: ['id', 'passwordHash'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isValidPassword = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );

    if (!isValidPassword) {
      throw new BadRequestException('Current password is incorrect');
    }

    user.passwordHash = await hashPassword(dto.newPassword);
    await this.userRepo.save(user);

    return { message: 'Password changed successfully' };
  }

  async remove(id: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Soft delete by deactivating
    user.isActive = false;
    await this.userRepo.save(user);
  }

  async assignRole(userId: string, roleId: string): Promise<Partial<User>> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['roles'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const role = await this.roleRepo.findOne({ where: { id: roleId } });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const alreadyHasRole = user.roles.some((r) => r.id === roleId);
    if (!alreadyHasRole) {
      user.roles.push(role);
      await this.userRepo.save(user);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = user;
    return result;
  }

  async removeRole(userId: string, roleId: string): Promise<Partial<User>> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['roles'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.roles = user.roles.filter((r) => r.id !== roleId);
    await this.userRepo.save(user);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = user;
    return result;
  }
}
