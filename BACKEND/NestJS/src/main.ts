import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  const expressApp = app.getHttpAdapter().getInstance();

  const TEMPLATE_PATH = path.join(__dirname, '..', 'config', 'portal.html');
  const TERMS_PATH = path.join(__dirname, '..', 'config', 'portal_terms.html');
  const SUCCESS_PATH = path.join(__dirname, '..', 'config', 'portal_success.html');

  const servePortal = (_req: any, res: any) => {
    let html = '';
    try { html = fs.readFileSync(TEMPLATE_PATH, 'utf-8'); }
    catch {
      html = `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>Hotspot Portal</title></head><body><h2>Portal não configurado</h2><p>Carregue um template na interface de administração.</p></body></html>`;
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    return res.send(html);
  };

  const serveTerms = (_req: any, res: any) => {
    let html = '';
    try { html = fs.readFileSync(TERMS_PATH, 'utf-8'); }
    catch {
      html = `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>Termos de Uso</title></head><body><h2>Termos não configurados</h2><p>Edite e salve os termos na interface de administração.</p></body></html>`;
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    return res.send(html);
  };

  const serveAuthorized = (_req: any, res: any) => {
    let html = '';
    try { html = fs.readFileSync(SUCCESS_PATH, 'utf-8'); }
    catch {
      html = `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>Login autorizado</title></head><body><h2>Login autorizado</h2><p>Você já pode usar a internet.</p></body></html>`;
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    return res.send(html);
  };

  // Rotas de portal sem prefixo
  expressApp.get('/', servePortal);
  expressApp.get('/portal', servePortal);
  expressApp.all('/guest/*', servePortal);
  expressApp.get('/terms', serveTerms);
  expressApp.get('/authorized', serveAuthorized);
  
  const PORT = parseInt(process.env.API_PORT || process.env.PORT || '3000', 10);
  await app.listen(PORT, '0.0.0.0');
  console.log(`Nest API rodando em http://localhost:${PORT}/api`);
}

bootstrap();