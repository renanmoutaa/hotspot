import { Controller, Get, Put, Body, Param, Delete, Query } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import * as https from 'https';

@Controller('unifi')
export class UnifiController {
  private SETTINGS_PATH = path.join(__dirname, '..', 'config', 'settings.json');
  // Diretórios de persistência e logs
  private DB_DIR = path.join(__dirname, '..', '..', 'Database');
  private UNIFI_DIR = path.join(this.DB_DIR, 'unifi');
  private LOGS_DIR = path.join(this.DB_DIR, 'logs');
  private AUDIT_FILE = path.join(this.LOGS_DIR, 'audit.log');

  private readSettings(): any {
    try {
      const raw = fs.readFileSync(this.SETTINGS_PATH, 'utf-8');
      return JSON.parse(raw);
    } catch (e) {
      return {};
    }
  }

  private ensureDir(p: string) {
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
  }

  private writeJson(file: string, data: any) {
    try {
      this.ensureDir(this.UNIFI_DIR);
      const fp = path.join(this.UNIFI_DIR, file);
      const tmp = fp + '.tmp';
      fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tmp, fp);
    } catch (e) {
      // falha ao gravar JSON de cache não deve quebrar a API
      this.audit('persist.write.error', { file, error: (e as any)?.message });
    }
  }

  private readJson(file: string): any {
    try {
      const fp = path.join(this.UNIFI_DIR, file);
      const raw = fs.readFileSync(fp, 'utf-8');
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  private audit(action: string, meta?: any) {
    const entryStr = JSON.stringify({ ts: new Date().toISOString(), action, ...(meta ? { meta } : {}) }) + '\n';
    try {
      this.ensureDir(this.LOGS_DIR);
      fs.appendFileSync(this.AUDIT_FILE, entryStr, 'utf-8');
    } catch {
      try {
        this.ensureDir(this.UNIFI_DIR);
        const fallback = path.join(this.UNIFI_DIR, 'audit.log');
        fs.appendFileSync(fallback, entryStr, 'utf-8');
      } catch {}
    }
  }

  private getHttp(s: any) {
    const agent = new https.Agent({ rejectUnauthorized: false });
    return axios.create({ baseURL: s.unifiUrl, httpsAgent: agent, withCredentials: true });
  }

  private async login(client: any, s: any): Promise<{ type: 'token' | 'cookie' | 'both'; token?: string; cookie?: string; csrf?: string; }> {
    let token: string | undefined;
    let cookie: string | undefined;
    let csrf: string | undefined;
    try {
      const res = await client.post('/api/auth/login', { username: s.unifiUser, password: s.unifiPass });
      if (res.data?.access_token) token = res.data.access_token;
    } catch (e) {}
    try {
      const res2 = await client.post('/api/login', { username: s.unifiUser, password: s.unifiPass });
      const setCookies: string[] = res2.headers['set-cookie'] || [];
      if (setCookies.length) {
        const pairs = setCookies.map((c) => (c || '').split(';')[0]).filter(Boolean);
        cookie = pairs.join('; ');
      }
      try {
        const rCsrf = await client.get('/api/auth/csrf', { headers: cookie ? { Cookie: cookie } : {} });
        csrf = (rCsrf.headers?.['x-csrf-token'] as string) || (rCsrf.data?.['csrf'] as string) || (rCsrf.data?.['csrf_token'] as string) || undefined;
      } catch {}
    } catch {}
    const type = token && cookie ? 'both' : (token ? 'token' : 'cookie');
    return { type, token, cookie, csrf };
  }

  private async fetchWlans(client: any, auth: any, site = 'default') {
    const headers: any = {};
    if (auth?.token) headers['Authorization'] = `Bearer ${auth.token}`;
    if (auth?.cookie) headers['Cookie'] = auth.cookie;
    if (auth?.csrf) headers['X-CSRF-Token'] = auth.csrf;
    const candidates = [
      `/proxy/network/api/s/${site}/rest/wlanconf`,
      `/api/s/${site}/rest/wlanconf`
    ];
    let lastError: any = null;
    for (const p of candidates) {
      try {
        const r = await client.get(p, { headers });
        if (r.data?.data) return r.data.data;
        if (Array.isArray(r.data)) return r.data;
      } catch (e) { lastError = e; }
    }
    throw lastError || new Error('Falha ao obter WLANs');
  }

  private async fetchDevices(client: any, auth: any, site = 'default') {
    const headers: any = {};
    if (auth?.token) headers['Authorization'] = `Bearer ${auth.token}`;
    if (auth?.cookie) headers['Cookie'] = auth.cookie;
    if (auth?.csrf) headers['X-CSRF-Token'] = auth.csrf;
    const candidates = [
      `/proxy/network/api/s/${site}/stat/device`,
      `/api/s/${site}/stat/device`
    ];
    let lastError: any = null;
    for (const p of candidates) {
      try {
        const r = await client.get(p, { headers });
        if (r.data?.data) return r.data.data;
        if (Array.isArray(r.data)) return r.data;
      } catch (e) { lastError = e; }
    }
    throw lastError || new Error('Falha ao obter devices');
  }

  private async fetchClients(client: any, auth: any, site = 'default') {
    const headers: any = {};
    if (auth?.token) headers['Authorization'] = `Bearer ${auth.token}`;
    if (auth?.cookie) headers['Cookie'] = auth.cookie;
    if (auth?.csrf) headers['X-CSRF-Token'] = auth.csrf;
    const candidates = [
      `/proxy/network/api/s/${site}/stat/sta`,
      `/api/s/${site}/stat/sta`
    ];
    let lastError: any = null;
    for (const p of candidates) {
      try {
        const r = await client.get(p, { headers });
        if (r.data?.data) return r.data.data;
        if (Array.isArray(r.data)) return r.data;
      } catch (e) { lastError = e; }
    }
    throw lastError || new Error('Falha ao obter clientes');
  }

  private async fetchSites(client: any, auth: any) {
    const headers: any = {};
    if (auth?.token) headers['Authorization'] = `Bearer ${auth.token}`;
    if (auth?.cookie) headers['Cookie'] = auth.cookie;
    if (auth?.csrf) headers['X-CSRF-Token'] = auth.csrf;
    const candidates = [
      `/proxy/network/api/self/sites`,
      `/api/self/sites`
    ];
    let lastError: any = null;
    for (const p of candidates) {
      try {
        const r = await client.get(p, { headers });
        const data = r.data?.data || r.data;
        if (Array.isArray(data)) return data;
      } catch (e) { lastError = e; }
    }
    throw lastError || new Error('Falha ao obter sites');
  }

  @Get('config')
  async config() { return this.readSettings(); }

  @Put('config')
  async saveConfig(@Body() body: any) {
    const current = this.readSettings();
    const next = { ...current, ...body };
    const dir = path.dirname(this.SETTINGS_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(this.SETTINGS_PATH, JSON.stringify(next, null, 2), 'utf-8');
    this.audit('unifi.config.save', { keys: Object.keys(body || {}) });
    return { ok: true };
  }

  @Get('test')
  async test() {
    const s = this.readSettings();
    if (!s.unifiUrl || !s.unifiUser || !s.unifiPass) return { ok: false, message: 'Configure URL, usuário e senha' };
    const client = this.getHttp(s);
    try { await this.login(client, s); this.audit('unifi.test.ok'); return { ok: true }; }
    catch (e: any) { this.audit('unifi.test.error', { error: e?.message, status: e?.response?.status || null }); return { ok: false, message: e?.message || 'Falha ao autenticar' }; }
  }

  @Get('sites')
  async sites() {
    const s = this.readSettings();
    if (!s.unifiUrl || !s.unifiUser || !s.unifiPass) return { items: [], total: 0, message: 'Configure UniFi primeiro' };
    const client = this.getHttp(s);
    const auth = await this.login(client, s);
    try {
      const data = await this.fetchSites(client, auth);
      const items = (data || []).map((x: any) => ({
        id: x._id || x.id || x.site_id || x.key || '',
        name: x.name || x.desc || x.site_name || 'site',
        desc: x.desc || x.name || '',
        role: x.role || x.role_name || '',
        site: x.name || x.code || x.key || x._id || ''
      }));
      const payload = { items, total: items.length, updatedAt: new Date().toISOString() };
      this.writeJson('sites.json', payload);
      this.audit('unifi.sites.ok', { total: items.length });
      return payload;
    } catch (e: any) {
      this.audit('unifi.sites.error', { error: e?.message, status: e?.response?.status || null });
      const cached = this.readJson('sites.json');
      if (cached) return { ...cached, fromCache: true };
      return { items: [], total: 0, message: 'Falha ao obter sites', error: e?.message, status: e?.response?.status || null };
    }
  }

  @Get('aps')
  async aps(@Query('site') siteQuery?: string) {
    const s = this.readSettings();
    if (!s.unifiUrl || !s.unifiUser || !s.unifiPass) return { items: [], total: 0, message: 'Configure UniFi primeiro' };
    const client = this.getHttp(s);
    const auth = await this.login(client, s);
    const site = (siteQuery && siteQuery.trim()) || s.unifiSite || 'default';
    try {
      const devices = await this.fetchDevices(client, auth, site);
      const portalMacs: string[] = Array.isArray(s.portalApMacs) ? s.portalApMacs : (s.portalApMac ? [s.portalApMac] : []);
      const aps = (devices || []).filter((d: any) => (d.type === 'uap') || (d.model || '').toLowerCase().includes('uap'))
        .map((d: any) => {
          const mac = d.mac || d.wlan_mac || '';
          return { name: d.name || d.hostname || d.device_name || 'AP', mac, ip: d.ip || d.inet_addr || '', model: d.model || d.product || '', version: d.version || '', status: (d.state === 1 || d.up) ? 'up' : 'down', is_portal: portalMacs.includes(mac), site };
        });
      const payload = { items: aps, total: aps.length, site, updatedAt: new Date().toISOString() };
      this.writeJson(`aps_${site}.json`, payload);
      this.audit('unifi.aps.ok', { site, total: aps.length });
      return payload;
    } catch (e: any) {
      console.error('Erro ao obter APs', e?.response?.status, e?.response?.data || e?.message);
      this.audit('unifi.aps.error', { site, error: e?.message, status: e?.response?.status || null });
      const cached = this.readJson(`aps_${site}.json`);
      if (cached) return { ...cached, fromCache: true };
      return { items: [], total: 0, message: 'Falha ao obter APs', error: e?.message, status: e?.response?.status || null };
    }
  }

  @Get('ssids')
  async ssids(@Query('site') siteQuery?: string) {
    const s = this.readSettings();
    if (!s.unifiUrl || !s.unifiUser || !s.unifiPass) return { items: [], total: 0, message: 'Configure UniFi primeiro' };
    const client = this.getHttp(s);
    const auth = await this.login(client, s);
    const site = (siteQuery && siteQuery.trim()) || s.unifiSite || 'default';
    try {
      const wlans = await this.fetchWlans(client, auth, site);
      const items = (wlans || []).map((w: any) => ({ name: w.ssid || w.name || 'Wi‑Fi', enabled: w.enabled !== false, security: w.security || (w.wpa_mode ? `wpa-${w.wpa_mode}` : 'open'), vlan_id: w.vlan || w.vlan_id || null, is_guest: !!w.is_guest || !!w.guest_policy, site }));
      const payload = { items, total: items.length, site, updatedAt: new Date().toISOString() };
      this.writeJson(`ssids_${site}.json`, payload);
      this.audit('unifi.ssids.ok', { site, total: items.length });
      return payload;
    } catch (e: any) {
      console.error('Erro ao obter SSIDs', e?.response?.status, e?.response?.data || e?.message);
      this.audit('unifi.ssids.error', { site, error: e?.message, status: e?.response?.status || null });
      const cached = this.readJson(`ssids_${site}.json`);
      if (cached) return { ...cached, fromCache: true };
      return { items: [], total: 0, message: 'Falha ao obter SSIDs', error: e?.message, status: e?.response?.status || null };
    }
  }

  @Get('clients')
  async clients(@Query('site') siteQuery?: string) {
    const s = this.readSettings();
    if (!s.unifiUrl || !s.unifiUser || !s.unifiPass) return { items: [], total: 0, message: 'Configure UniFi primeiro' };
    const client = this.getHttp(s);
    const auth = await this.login(client, s);
    const site = (siteQuery && siteQuery.trim()) || s.unifiSite || 'default';
    try {
      const data = await this.fetchClients(client, auth, site);
      const items = (data || []).map((c: any) => ({ ...c, site }));
      const payload = { items, total: items.length, site, updatedAt: new Date().toISOString() };
      this.writeJson(`clients_${site}.json`, payload);
      this.audit('unifi.clients.ok', { site, total: items.length });
      return payload;
    } catch (e: any) {
      console.error('Erro ao obter clientes', e?.response?.status, e?.response?.data || e?.message);
      this.audit('unifi.clients.error', { site, error: e?.message, status: e?.response?.status || null });
      const cached = this.readJson(`clients_${site}.json`);
      if (cached) return { ...cached, fromCache: true };
      return { items: [], total: 0, message: 'Falha ao obter clientes', error: e?.message, status: e?.response?.status || null };
    }
  }
}