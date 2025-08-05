import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Employee } from './entities/employee.entity';
import {
  EmploymentContract,
  ContractStatus,
} from './entities/employment-contract.entity';

@Injectable()
export class HrmsService {
  constructor(
    @InjectRepository(Employee)
    private empRepo: Repository<Employee>,
    @InjectRepository(EmploymentContract)
    private contractRepo: Repository<EmploymentContract>,
    private dataSource: DataSource,
  ) {}

  async createEmployee(data: Partial<Employee>): Promise<Employee> {
    const emp = this.empRepo.create({
      ...data,
      hireDate: new Date().toISOString().split('T')[0],
      code: `EMP-${Date.now()}`,
    });
    return this.empRepo.save(emp);
  }

  async addContract(
    employeeId: string,
    data: Partial<EmploymentContract>,
  ): Promise<EmploymentContract> {
    const emp = await this.empRepo.findOne({ where: { id: employeeId } });
    if (!emp) throw new NotFoundException('Employee not found');

    const contract = this.contractRepo.create({
      ...data,
      employeeId: emp.id,
      status: ContractStatus.DRAFT,
    });
    return this.contractRepo.save(contract);
  }

  async activateContract(id: string): Promise<EmploymentContract> {
    const contract = await this.contractRepo.findOne({ where: { id } });
    if (!contract) throw new NotFoundException('Contract not found');

    contract.status = ContractStatus.ACTIVE;
    return this.contractRepo.save(contract);
  }
}
