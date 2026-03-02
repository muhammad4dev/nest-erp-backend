import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Employee } from './entities/employee.entity';
import {
  EmploymentContract,
  ContractStatus,
} from './entities/employment-contract.entity';
import { TenantContext } from '../../common/context/tenant.context';
import { wrapTenantRepository } from '../../common/repositories/tenant-repository-wrapper';

@Injectable()
export class HrmsService {
  private empRepo: Repository<Employee>;
  private contractRepo: Repository<EmploymentContract>;

  constructor(
    @InjectRepository(Employee)
    empRepoBase: Repository<Employee>,
    @InjectRepository(EmploymentContract)
    contractRepoBase: Repository<EmploymentContract>,
    private dataSource: DataSource,
  ) {
    this.empRepo = wrapTenantRepository(empRepoBase);
    this.contractRepo = wrapTenantRepository(contractRepoBase);
  }

  private toPaginationParams(query: Record<string, unknown>) {
    const skip = Number(query.skip ?? 0);
    const take = Number(query.take ?? 20);

    const safeSkip = Number.isFinite(skip) && skip >= 0 ? skip : 0;
    const safeTake = Number.isFinite(take) && take > 0 ? take : 20;
    const page = Math.floor(safeSkip / safeTake) + 1;

    return { skip: safeSkip, take: safeTake, page, limit: safeTake };
  }

  async createEmployee(data: Partial<Employee>): Promise<Employee> {
    const tenantId = TenantContext.requireTenantId();

    const existing = await this.empRepo.findOne({
      where: { email: data.email },
      select: ['id'],
    });

    if (existing) {
      throw new ConflictException('Employee email already exists');
    }

    const emp = this.empRepo.create({
      ...data,
      tenantId,
      hireDate: data.hireDate || new Date().toISOString().split('T')[0],
      code: `EMP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    });
    return this.empRepo.save(emp);
  }

  async findEmployees(query: Record<string, unknown>) {
    const { skip, take, page, limit } = this.toPaginationParams(query);
    const search = String(query.search ?? '').trim();
    const department = String(query.department ?? '').trim();

    const qb = this.empRepo.createQueryBuilder('employee');

    if (department) {
      qb.andWhere('employee.department = :department', { department });
    }

    if (search) {
      qb.andWhere(
        '(employee.code ILIKE :search OR employee.first_name ILIKE :search OR employee.last_name ILIKE :search OR employee.email ILIKE :search)',
        {
          search: `%${search}%`,
        },
      );
    }

    qb.orderBy('employee.createdAt', 'DESC').skip(skip).take(take);

    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, limit };
  }

  async findEmployeeById(id: string): Promise<Employee> {
    const employee = await this.empRepo.findOne({
      where: { id },
      relations: ['contracts'],
    });
    if (!employee) throw new NotFoundException('Employee not found');
    return employee;
  }

  async updateEmployee(id: string, data: Partial<Employee>): Promise<Employee> {
    const employee = await this.findEmployeeById(id);
    Object.assign(employee, data);
    return this.empRepo.save(employee);
  }

  async removeEmployee(id: string): Promise<void> {
    const employee = await this.findEmployeeById(id);
    await this.empRepo.remove(employee);
  }

  async addContract(
    employeeId: string,
    data: Partial<EmploymentContract>,
  ): Promise<EmploymentContract> {
    const tenantId = TenantContext.requireTenantId();

    const emp = await this.empRepo.findOne({ where: { id: employeeId } });
    if (!emp) throw new NotFoundException('Employee not found');

    const contract = this.contractRepo.create({
      ...data,
      tenantId,
      employeeId: emp.id,
      status: ContractStatus.DRAFT,
    });
    return this.contractRepo.save(contract);
  }

  async findContracts(query: Record<string, unknown>) {
    const { skip, take, page, limit } = this.toPaginationParams(query);
    const search = String(query.search ?? '').trim();
    const status = String(query.status ?? '').trim();

    const qb = this.contractRepo
      .createQueryBuilder('contract')
      .leftJoinAndSelect('contract.employee', 'employee');

    if (status) {
      qb.andWhere('contract.status = :status', { status });
    }

    if (search) {
      qb.andWhere(
        '(contract.job_position ILIKE :search OR employee.code ILIKE :search OR employee.first_name ILIKE :search OR employee.last_name ILIKE :search)',
        {
          search: `%${search}%`,
        },
      );
    }

    qb.orderBy('contract.createdAt', 'DESC').skip(skip).take(take);

    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, limit };
  }

  async findContractById(id: string): Promise<EmploymentContract> {
    const contract = await this.contractRepo.findOne({
      where: { id },
      relations: ['employee'],
    });
    if (!contract) throw new NotFoundException('Contract not found');
    return contract;
  }

  async findContractsByEmployeeId(
    employeeId: string,
  ): Promise<EmploymentContract[]> {
    await this.findEmployeeById(employeeId);

    return this.contractRepo.find({
      where: { employeeId },
      relations: ['employee'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateContract(
    id: string,
    data: Partial<EmploymentContract>,
  ): Promise<EmploymentContract> {
    const contract = await this.findContractById(id);
    Object.assign(contract, data);
    return this.contractRepo.save(contract);
  }

  async removeContract(id: string): Promise<void> {
    const contract = await this.findContractById(id);
    await this.contractRepo.remove(contract);
  }

  async activateContract(id: string): Promise<EmploymentContract> {
    const contract = await this.findContractById(id);

    contract.status = ContractStatus.ACTIVE;
    return this.contractRepo.save(contract);
  }
}
