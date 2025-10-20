import { Controller, Get, Put, Body, Param, Delete } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import * as https from 'https';

@Controller('unifi')
export class UnifiController {
  private SETTINGS_PATH = path.join(__dirname, '..', 'config', 'settings.json');

  private readSettings(): any {
    try {
      const raw = fs.readFileSync(this.SETTINGS_PATH, 'utf-8');
      return JSON.parse(raw);
    } catch (e) {
      return {};
    }
  }

  private getHttp(s: any) {
    const agent = new https.Agent({ rejectUnauthorized: false });
    return axios.create({ baseURL: s.unifiUrl, httpsAgent: agent, withCredentials: true });
  }

  private async login(client: any, s: any): Promise<{ type: 'token' | 'cookie'; token?: string; cookie?: string; }> {
    try {
      const res = await client.post('/api/auth/login', { username: s.unifiUser, password: s.unifiPass });
      if (res.data?.access_token) return { type: 'token', token: res.data.access_token };
    } catch (e) {
      // ignore and fallback
    }
    const res2 = await client.post('/api/login', { username: s.unifiUser, password: s.unifiPass });
    const cookies: string[] = res2.headers['set-cookie'] || [];
    const cookie = cookies.join('; ');
    return { type: 'cookie', cookie };
  }

  private async fetchDevices(client: any, auth: any, site = 'default') {
    const headers: any = {};
    if (auth.type === 'token' && auth.token) headers['Authorization'] = `Bearer ${auth.token}`;
    if (auth.type === 'cookie' && auth.cookie) headers['Cookie'] = auth.cookie;
    const candidates = [
      `/proxy/network/api/s/${site}/stat/device`,
      `/api/s/${site}/stat/device`
    ];
    let lastError: any = null;
    for (const p of candidates) {
      try {
        const r = await client.get(p, { headers });
        if (r.data?.data) return r.data.data;
        if (Array.isArray(r.data)) return r.data; // fallback in some versions
      } catch (e) {
        lastError = e;
      }
    }
    throw lastError || new Error('Falha ao obter dispositivos');
  }

  private async fetchWlans(client: any, auth: any, site = 'default') {
    const headers: any = {};
    if (auth.type === 'token' && auth.token) headers['Authorization'] = `Bearer ${auth.token}`;
    if (auth.type === 'cookie' && auth.cookie) headers['Cookie'] = auth.cookie;
    const candidates = [
      `/proxy/network/api/s/${site}/rest/wlanconf`,
      `/api/s/${site}/rest/wlanconf`
    ];
    let lastError: any = null;
    for (const p of candidates) {
      try {
        const r = await client.get(p, { headers });
        if (r.data?.data) return r.data.data;
        if (Array.isArray(r.data)) return r.data; // fallback
      } catch (e) {
        lastError = e;
      }
    }
    throw lastError || new Error('Falha ao obter redes Wi‑Fi');
  }

  private async fetchClients(client: any, auth: any, site = 'default') {
    const headers: any = {};
    if (auth.type === 'token' && auth.token) headers['Authorization'] = `Bearer ${auth.token}`;
    if (auth.type === 'cookie' && auth.cookie) headers['Cookie'] = auth.cookie;
    const candidates = [
      `/proxy/network/api/s/${site}/stat/sta`,
      `/api/s/${site}/stat/sta`
    ];
    let lastError: any = null;
    for (const p of candidates) {
      try {
        const r = await client.get(p, { headers });
        if (r.data?.data) return r.data.data;
        if (Array.isArray(r.data)) return r.data; // fallback
      } catch (e) {
        lastError = e;
      }
    }
    throw lastError || new Error('Falha ao obter clientes');
  }

  @Get('test')
  test() {
    const s = this.readSettings();
    const ok = !!(s.unifiUrl && s.unifiUser && s.unifiPass);
    return { ok, message: ok ? 'Conexão simulada Ok' : 'Configure UniFi (URL, usuário, senha)' };
  }

  @Get('config')
  getConfig() {
    const s = this.readSettings();
    return { unifiUrl: s.unifiUrl || '', unifiUser: s.unifiUser || '', unifiPass: s.unifiPass || '', unifiSite: s.unifiSite || 'default' };
  }

  @Put('config')
  setConfig(@Body() body: any) {
    const s = this.readSettings();
    const next = { ...s, ...body };
    const dir = path.dirname(this.SETTINGS_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(this.SETTINGS_PATH, JSON.stringify(next, null, 2), 'utf-8');
    return { ok: true };
  }

  @Get('aps')
  async aps() {
    const s = this.readSettings();
    if (!s.unifiUrl || !s.unifiUser || !s.unifiPass) return { items: [], total: 0, message: 'Configure UniFi primeiro' };
    const client = this.getHttp(s);
    const auth = await this.login(client, s);
    const site = s.unifiSite || 'default';
    const devices = await this.fetchDevices(client, auth, site);
    const aps = (devices || []).filter((d: any) => (d.type === 'uap') || (d.model || '').toLowerCase().includes('uap'))
      .map((d: any) => ({
        name: d.name || d.hostname || d.device_name || 'AP',
        mac: d.mac || d.wlan_mac || '',
        ip: d.ip || d.inet_addr || '',
        model: d.model || d.product || '',
        version: d.version || '',
        status: (d.state === 1 || d.up) ? 'up' : 'down'
      }));
    return { items: aps, total: aps.length };
  }

  @Get('ssids')
  async ssids() {
    const s = this.readSettings();
    if (!s.unifiUrl || !s.unifiUser || !s.unifiPass) return { items: [], total: 0, message: 'Configure UniFi primeiro' };
    const client = this.getHttp(s);
    const auth = await this.login(client, s);
    const site = s.unifiSite || 'default';
    const wlans = await this.fetchWlans(client, auth, site);
    const items = (wlans || []).map((w: any) => ({
      name: w.ssid || w.name || 'Wi‑Fi',
      enabled: w.enabled !== false,
      security: w.security || (w.wpa_mode ? `wpa-${w.wpa_mode}` : 'open'),
      vlan_id: w.vlan || w.vlan_id || null,
      is_guest: !!w.is_guest || !!w.guest_policy,
    }));
    return { items, total: items.length };
  }

  @Get('clients')
  async clients() {
    const s = this.readSettings();
    if (!s.unifiUrl || !s.unifiUser || !s.unifiPass) return { items: [], total: 0, message: 'Configure UniFi primeiro' };
    const client = this.getHttp(s);
    const auth = await this.login(client, s);
    const site = s.unifiSite || 'default';
    const stas = await this.fetchClients(client, auth, site);
    const items = (stas || []).map((c: any) => ({
      hostname: c.hostname || c.name || 'Cliente',
      mac: c.mac || '',
      ip: c.ip || c.network && c.network.ip || '',
      ap_mac: c.ap_mac || c.ap_mac || '',
      essid: c.essid || c.ssid || '',
      signal: c.signal || c.rssi || 0,
      authorized: c.authorized ?? true,
      is_guest: c.is_guest ?? false,
      rx_rate: c.rx_rate || 0,
      tx_rate: c.tx_rate || 0,
    }));
    return { items, total: items.length };
  }
}