import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersController } from './users.controller';
import { VouchersController } from './vouchers.controller';
import { ApsController } from './aps.controller';
import { ReportsController } from './reports.controller';
import { SettingsController } from './settings.controller';
import { UnifiController } from './unifi.controller';
import { PortalController } from './portal.controller';

@Module({
  controllers: [AppController, UsersController, VouchersController, ApsController, ReportsController, SettingsController, UnifiController, PortalController],
  providers: [AppService],
})
export class AppModule {}