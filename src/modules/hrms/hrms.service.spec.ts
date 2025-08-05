import { Test, TestingModule } from '@nestjs/testing';
import { HrmsService } from './hrms.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Employee } from './entities/employee.entity';
import {
  EmploymentContract,
  ContractStatus,
} from './entities/employment-contract.entity';
import { DataSource } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

describe('HrmsService', () => {
  let service: HrmsService;

  const mockEmpRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockContractRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockDataSource = {}; // Not using transaction in current service logic

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HrmsService,
        {
          provide: getRepositoryToken(Employee),
          useValue: mockEmpRepo,
        },
        {
          provide: getRepositoryToken(EmploymentContract),
          useValue: mockContractRepo,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<HrmsService>(HrmsService);
  });

  describe('createEmployee', () => {
    it('should create an employee', async () => {
      const empData = { firstName: 'John', lastName: 'Doe', email: 'j@d.com' };
      mockEmpRepo.create.mockReturnValue({
        ...empData,
        hireDate: '2023-01-01',
        code: 'EMP-1',
      });
      mockEmpRepo.save.mockResolvedValue({ id: 'uuid-1', ...empData });

      const result = await service.createEmployee(empData);
      expect(result.id).toBe('uuid-1');
      expect(mockEmpRepo.save).toHaveBeenCalled();
    });
  });

  describe('addContract', () => {
    it('should throw if employee not found', async () => {
      mockEmpRepo.findOne.mockResolvedValue(null);
      await expect(service.addContract('uuid-1', {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should create a draft contract', async () => {
      mockEmpRepo.findOne.mockResolvedValue({ id: 'uuid-1' });
      mockContractRepo.create.mockReturnValue({
        status: ContractStatus.DRAFT,
        employeeId: 'uuid-1',
      });
      mockContractRepo.save.mockResolvedValue({
        id: 'c-1',
        status: ContractStatus.DRAFT,
      });

      const result = await service.addContract('uuid-1', { wage: 5000 });
      expect(result.status).toBe(ContractStatus.DRAFT);
    });
  });
});
