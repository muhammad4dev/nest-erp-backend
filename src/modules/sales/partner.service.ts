import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Partner } from './entities/partner.entity';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { UpdatePartnerDto } from './dto/update-partner.dto';

@Injectable()
export class PartnerService {
  constructor(
    @InjectRepository(Partner)
    private partnerRepo: Repository<Partner>,
  ) {}

  async create(dto: CreatePartnerDto): Promise<Partner> {
    const partner = this.partnerRepo.create(dto);
    return this.partnerRepo.save(partner);
  }

  async findAll(filters?: {
    isCustomer?: boolean;
    isVendor?: boolean;
  }): Promise<Partner[]> {
    const where: Record<string, boolean> = {};

    if (filters?.isCustomer !== undefined) {
      where.isCustomer = filters.isCustomer;
    }
    if (filters?.isVendor !== undefined) {
      where.isVendor = filters.isVendor;
    }

    return this.partnerRepo.find({ where });
  }

  async findOne(id: string): Promise<Partner> {
    const partner = await this.partnerRepo.findOne({ where: { id } });

    if (!partner) {
      throw new NotFoundException('Partner not found');
    }

    return partner;
  }

  async update(id: string, dto: UpdatePartnerDto): Promise<Partner> {
    const partner = await this.findOne(id);
    Object.assign(partner, dto);
    return this.partnerRepo.save(partner);
  }

  async remove(id: string): Promise<void> {
    const partner = await this.findOne(id);
    await this.partnerRepo.remove(partner);
  }
}
