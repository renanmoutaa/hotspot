import { Controller, Get } from '@nestjs/common';

@Controller('vouchers')
export class VouchersController {
  @Get()
  list() {
    return { items: [], total: 0 };
  }
}