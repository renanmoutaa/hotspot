import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getRoot() {
    return { status: 'ok', backend: 'nest' };
  }

  @Get('auth')
  getAuth() {
    return { message: 'auth route placeholder' };
  }
}