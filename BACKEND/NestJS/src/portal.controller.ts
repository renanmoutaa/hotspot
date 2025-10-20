import { Controller, Get, Put, Post, Body, Res, Req } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { Response } from 'express';

@Controller('portal')
export class PortalController {
  private TEMPLATE_PATH = path.join(__dirname, '..', 'config', 'portal.html');
  private TERMS_PATH = path.join(__dirname, '..', 'config', 'portal_terms.html');
  private SUCCESS_PATH = path.join(__dirname, '..', 'config', 'portal_success.html');
  private REG_PATH = path.join(__dirname, '..', 'config', 'portal_registrations.json');

  @Get('template')
  getTemplate() {
    try {
      const html = fs.readFileSync(this.TEMPLATE_PATH, 'utf-8');
      return { html };
    } catch {
      const html = `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>Hotspot Portal</title><style>body{font-family:system-ui;margin:0;padding:16px;background:#f5f5f5} .card{max-width:420px;margin:0 auto;background:#fff;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,.06)} .title{font-weight:600;margin:0 0 8px} .desc{color:#666;margin:0 0 12px}</style></head><body><div class="card"><h3 class="title">Portal não configurado</h3><p class="desc">Carregue um template na interface de administração.</p></div></body></html>`;
      return { html };
    }
  }

  @Put('template')
  setTemplate(@Body() body: any) {
    const html = body?.html || '';
    const dir = path.dirname(this.TEMPLATE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(this.TEMPLATE_PATH, html, 'utf-8');
    return { ok: true };
  }

  @Get('terms-template')
  getTermsTemplate() {
    try {
      const html = fs.readFileSync(this.TERMS_PATH, 'utf-8');
      return { html };
    } catch {
      const html = `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>Termos de Uso</title><style>body{font-family:system-ui;margin:0;padding:16px;background:#fff} .container{max-width:640px;margin:0 auto} .title{font-weight:600;margin:0 0 8px} .desc{color:#666;margin:0 0 12px}</style></head><body><div class="container"><h3 class="title">Termos não configurados</h3><p class="desc">Carregue conteúdo de termos na administração.</p></div></body></html>`;
      return { html };
    }
  }

  @Put('terms-template')
  setTermsTemplate(@Body() body: any) {
    const html = body?.html || '';
    const dir = path.dirname(this.TERMS_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(this.TERMS_PATH, html, 'utf-8');
    return { ok: true };
  }

  // Novo: Template de sucesso (login autorizado)
  @Get('success-template')
  getSuccessTemplate() {
    try {
      const html = fs.readFileSync(this.SUCCESS_PATH, 'utf-8');
      return { html };
    } catch {
      const html = `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>Login autorizado</title><style>body{font-family:system-ui;margin:0;padding:16px;background:#f5f5f5} .card{max-width:420px;margin:32px auto;background:#fff;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,.06)} .title{font-weight:600;margin:0 0 8px} .desc{color:#666;margin:0 0 12px}</style></head><body><div class="card"><h3 class="title">Login autorizado</h3><p class="desc">Você já pode usar a internet.</p></div></body></html>`;
      return { html };
    }
  }

  @Put('success-template')
  setSuccessTemplate(@Body() body: any) {
    const html = body?.html || '';
    const dir = path.dirname(this.SUCCESS_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(this.SUCCESS_PATH, html, 'utf-8');
    return { ok: true };
  }

  // Serve o portal diretamente como text/html para uso pelo AP (com injeção defensiva)
  @Get('page')
  renderPortal(@Req() req: any, @Res() res: Response) {
    let html = '';
    try { html = fs.readFileSync(this.TEMPLATE_PATH, 'utf-8'); }
    catch {
      html = `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>Hotspot Portal</title></head><body><h2>Portal não configurado</h2><p>Carregue um template na interface de administração.</p></body></html>`;
    }
    // Injeta action/method e names se faltarem, além de href de termos conforme ambiente
    const ref = req?.headers?.referer || req?.headers?.referrer || '';
    const host = req?.headers?.host || '';
    const isDev = (ref || '').includes(':5173') || (host || '').includes(':5173');
    const targetRegister = isDev ? '/api/portal/register' : '/portal/register';
    const termsHref = isDev ? '/api/portal/terms-page' : '/portal/terms-page';
    const injectScript = `
<script>(function(){try{
  var target='${targetRegister}'; var terms='${termsHref}';
  var forms=document.querySelectorAll('form');
  forms.forEach(function(f){
    var act=f.getAttribute('action'); if(!act||act==='#'){ f.setAttribute('action', target); }
    var m=f.getAttribute('method'); if(!m){ f.setAttribute('method', 'post'); }
    var chk=f.querySelector('input[type=checkbox]'); if(chk){ if(!chk.getAttribute('name')) { chk.setAttribute('name','accept_terms'); } chk.setAttribute('required',''); }
    var email=f.querySelector('input[type=email]'); if(email && !email.getAttribute('name')) { email.setAttribute('name','email'); }
    var phone=f.querySelector('input[type=tel]'); if(phone && !phone.getAttribute('name')) { phone.setAttribute('name','phone'); }
  });
  var links=document.querySelectorAll('a');
  links.forEach(function(a){ var txt=(a.textContent||'').toLowerCase(); if(txt.includes('termo')) { a.setAttribute('href', terms); }});
}catch(e){}})();</script>`;
    if (html.includes('</body>')) html = html.replace('</body>', injectScript + '</body>');
    else html = html + injectScript;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    return res.send(html);
  }

  // Serve os termos como text/html
  @Get('terms-page')
  renderTerms(@Res() res: Response) {
    let html = '';
    try { html = fs.readFileSync(this.TERMS_PATH, 'utf-8'); }
    catch {
      html = `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>Termos de Uso</title></head><body><h2>Termos não configurados</h2><p>Carregue conteúdo de termos na administração.</p></body></html>`;
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    return res.send(html);
  }

  // Novo: página de sucesso como text/html
  @Get('authorized-page')
  renderAuthorized(@Res() res: Response) {
    let html = '';
    try { html = fs.readFileSync(this.SUCCESS_PATH, 'utf-8'); }
    catch {
      html = `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>Login autorizado</title></head><body><h2>Login autorizado</h2><p>Você já pode usar a internet.</p></body></html>`;
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    return res.send(html);
  }

  @Post('register')
  captureRegistration(@Req() req: any, @Res() res: any, @Body() body: any) {
    const dir = path.dirname(this.REG_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    let list: any[] = [];
    try { const raw = fs.readFileSync(this.REG_PATH, 'utf-8'); list = JSON.parse(raw); } catch {}
    const urlQuery = (req?.url || '').split('?')[1] || '';
    const q = new URLSearchParams(urlQuery);
    const ref = req?.headers?.referer || req?.headers?.referrer || '';
    const qRef = new URLSearchParams(ref ? (ref.split('?')[1] || '') : '');
    const accepted = (body?.accept_terms === 'on' || body?.accept_terms === true || body?.accept_terms === 'true' || body?.accept_terms === 1 || body?.accept_terms === '1');
    const record = {
      ts: new Date().toISOString(),
      name: body?.name || '',
      email: body?.email || '',
      phone: body?.phone || '',
      accept_terms: accepted,
      ap_mac: body?.ap_mac ?? q.get('ap_mac') ?? qRef.get('ap_mac') ?? '',
      essid: body?.essid ?? q.get('ssid') ?? q.get('essid') ?? qRef.get('ssid') ?? qRef.get('essid') ?? '',
      client_mac: body?.client_mac ?? q.get('id') ?? q.get('mac') ?? qRef.get('id') ?? qRef.get('mac') ?? '',
      ip: req?.ip || req?.headers?.['x-real-ip'] || '',
      user_agent: req?.headers?.['user-agent'] || '',
      referrer: ref,
    };
    list.push(record);
    fs.writeFileSync(this.REG_PATH, JSON.stringify(list, null, 2), 'utf-8');
    // Redireciona conforme ambiente; valida termos obrigatórios
    const isDev = (ref || '').includes(':5173') || (req?.headers?.host || '').includes(':5173');
    if (!accepted) {
      const portalTarget = isDev ? '/api/portal/page' : '/portal';
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(400).send(`<!doctype html><html><head><meta charset=\"utf-8\"/><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"/></head><body><script>try{alert('É necessário aceitar os termos para continuar');var t='${portalTarget}';window.top?window.top.location.replace(t):window.location.replace(t);}catch(e){window.location.href='${portalTarget}';}</script></body></html>`);
    }
    const redirectTarget = isDev ? '/api/portal/authorized-page' : '/authorized';
    if (isDev) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(`<!doctype html><html><head><meta charset=\"utf-8\"/><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"/></head><body><script>try{var t='${redirectTarget}';window.top?window.top.location.replace(t):window.location.replace(t);}catch(e){window.location.href=t;}</script></body></html>`);
    }
    return res.redirect(redirectTarget);
  }

  @Get('registrations')
  listRegistrations() {
    try { const raw = fs.readFileSync(this.REG_PATH, 'utf-8'); return { items: JSON.parse(raw) }; }
    catch { return { items: [] }; }
  }
}