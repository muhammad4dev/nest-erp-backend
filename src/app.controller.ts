import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getRoot(): { status: string; message: string } {
    return {
      status: 'ok',
      message: 'NestJS ERP API is running',
    };
  }
}
