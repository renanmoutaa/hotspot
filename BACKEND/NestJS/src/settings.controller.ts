import { Controller, Get, Put, Body } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Controller('settings')
export class SettingsController {
  private SETTINGS_PATH = path.join(__dirname, '..', 'config', 'settings.json');

  private readSettings(): any {
    try {
      const raw = fs.readFileSync(this.SETTINGS_PATH, 'utf-8');
      return JSON.parse(raw);
    } catch (e) {
      return {
        unifiUrl: process.env.UNIFI_URL || '',
        unifiUser: process.env.UNIFI_USER || '',
        unifiPass: process.env.UNIFI_PASS || '',
        radiusHost: process.env.RADIUS_HOST || 'localhost',
        radiusSecret: process.env.RADIUS_SECRET || '',
      };
    }
  }

  private writeSettings(payload: any) {
    const dir = path.dirname(this.SETTINGS_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(this.SETTINGS_PATH, JSON.stringify(payload, null, 2), 'utf-8');
  }

  @Get()
  get() {
    return this.readSettings();
  }

  @Put()
  update(@Body() body: any) {
    const current = this.readSettings();
    const next = { ...current, ...body };
    this.writeSettings(next);
    return { ok: true, settings: next };
  }
}