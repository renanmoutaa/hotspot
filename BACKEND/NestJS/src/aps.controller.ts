import { Controller, Get } from '@nestjs/common';

@Controller('aps')
export class ApsController {
  @Get()
  list() {
    return { items: [], total: 0 };
  }
}