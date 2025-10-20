import React, { useEffect, useRef, useState } from 'react';
import { Card, Alert, Button, Space, message, Tabs, Select, Input } from 'antd';
import apiPy from '../services/apiPy';
import apiNest from '../services/apiNest';
import grapesjs from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
import presetWebpage from 'grapesjs-preset-webpage';

const fontOptions = [
  { label: 'Inter', value: 'Inter', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap' },
  { label: 'Roboto', value: 'Roboto', href: 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap' },
  { label: 'Open Sans', value: 'Open Sans', href: 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap' },
  { label: 'Montserrat', value: 'Montserrat', href: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap' },
  { label: 'Poppins', value: 'Poppins', href: 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap' },
];

const Portal: React.FC = () => {
  const [activeTab, setActiveTab] = useState('editor');
  const editorHomeRef = useRef<any>(null);
  const editorTermsRef = useRef<any>(null);
  const editorSuccessRef = useRef<any>(null);
  const homeEl = useRef<HTMLDivElement | null>(null);
  const termsEl = useRef<HTMLDivElement | null>(null);
  const successEl = useRef<HTMLDivElement | null>(null);

  const [bgColor, setBgColor] = useState('#ffffff');
  const [textColor, setTextColor] = useState('#1f1f1f');
  const [fontFamily, setFontFamily] = useState<string>('Inter');
  const [accentColor, setAccentColor] = useState<string>('#1677ff');
  const [selectedCmp, setSelectedCmp] = useState<any>(null);
  const [panelTitle, setPanelTitle] = useState<string>('');
  const [panelDesc, setPanelDesc] = useState<string>('');

  const getEditor = () => (activeTab === 'editor' ? editorHomeRef.current : activeTab === 'terms' ? editorTermsRef.current : editorSuccessRef.current);

  const baseCSS = `
    .hs-page{max-width:480px;margin:0 auto;padding:24px}
    .brand{display:flex;align-items:center;gap:10px;justify-content:center;margin-bottom:16px}
    .brand img{width:48px;height:48px;border-radius:12px}
    .title{text-align:center;margin:0 0 6px;font-weight:600}
    .desc{text-align:center;margin:0 0 16px;color:#666}
    .btn{display:block;width:100%;padding:12px 16px;border-radius:10px;border:none;background:var(--accent);color:#fff;text-decoration:none;text-align:center}
    .input{display:block;width:100%;padding:10px;border:1px solid #ddd;border-radius:10px;margin:8px 0}
    .terms{display:flex;gap:8px;align-items:center;justify-content:center;margin-top:12px;font-size:14px}
    .footer{text-align:center;color:#888;margin-top:16px;font-size:12px}
  `;

  const buildTemplate = (kind: 'facebook'|'email'|'phone'|'instagram'|'twitter') => {
    const header = `
      <div class="brand">
        <img src="https://dummyimage.com/96x96/eee/aaa.png&text=WiFi" alt="logo"/>
        <div>
          <h3 class="title">Conectar ao Wi‑Fi</h3>
          <p class="desc">Escolha seu método de login</p>
        </div>
      </div>
    `;
    const terms = `
      <label class="terms">
        <input type="checkbox" name="accept_terms" required/>
        <span>Li e aceito os <a href="/api/portal/terms-page" target="_blank">Termos de Uso</a></span>
      </label>
    `;
    if (kind === 'facebook') return `
      <style>${baseCSS}</style>
      <section class="hs-page" style="--accent:${accentColor}">
        ${header}
        <a class="btn" href="#">Entrar com Facebook</a>
        ${terms}
        <div class="footer">Powered by Hotspot</div>
      </section>
    `;
    if (kind === 'instagram') return `
      <style>${baseCSS}</style>
      <section class="hs-page" style="--accent:${accentColor}">
        ${header}
        <a class="btn" href="#">Entrar com Instagram</a>
        ${terms}
        <div class="footer">Powered by Hotspot</div>
      </section>
    `;
    if (kind === 'twitter') return `
      <style>${baseCSS}</style>
      <section class="hs-page" style="--accent:${accentColor}">
        ${header}
        <a class="btn" href="#">Entrar com Twitter / X</a>
        ${terms}
        <div class="footer">Powered by Hotspot</div>
      </section>
    `;
    if (kind === 'email') return `
      <style>${baseCSS}</style>
      <section class="hs-page" style="--accent:${accentColor}">
        ${header}
        <form action="/api/portal/register" method="post">
          <input class="input" type="email" name="email" placeholder="Seu e‑mail" required/>
          ${terms}
          <button class="btn" type="submit">Entrar</button>
        </form>
        <div class="footer">Powered by Hotspot</div>
      </section>
    `;
    // phone
    return `
      <style>${baseCSS}</style>
      <section class="hs-page" style="--accent:${accentColor}">
        ${header}
        <form action="/api/portal/register" method="post">
          <input class="input" type="tel" name="phone" placeholder="Seu número (DDD+Telefone)" required/>
          ${terms}
          <button class="btn" type="submit">Receber SMS</button>
        </form>
        <div class="footer">Powered by Hotspot</div>
      </section>
    `;
  };

  const loadTemplate = (kind: 'facebook'|'email'|'phone'|'instagram'|'twitter') => {
    const ed = getEditor(); if (!ed) return;
    ed.setComponents(buildTemplate(kind));
    syncPanelTexts(ed);
    message.success(`Template ${kind} carregado`);
  };

  const clearPage = () => {
    const ed = getEditor(); if (!ed) return;
    ed.setComponents(`<style>${baseCSS}</style><section class="hs-page" style="--accent:${accentColor}"><h3 class="title">Nova página</h3><p class="desc">Adicione blocos ou carregue um template</p></section>`);
    syncPanelTexts(ed);
    message.info('Página limpa');
  };

  const applyTheme = (ed: any) => {
    try {
      const doc = ed.Canvas.getDocument();
      const found = fontOptions.find(f => f.value === fontFamily);
      if (found) {
        const link = doc.createElement('link');
        link.rel = 'stylesheet';
        link.href = found.href;
        doc.head.appendChild(link);
      }
      doc.documentElement.style.setProperty('--accent', accentColor);
      const wrapper = ed.DomComponents.getWrapper();
      wrapper.setStyle({ 'background-color': bgColor, color: textColor, 'font-family': `${fontFamily}, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial` });
    } catch {}
  };

  const initEditor = async (type: 'home' | 'terms' | 'success') => {
    const isHome = type === 'home';
    const el = type === 'home' ? homeEl.current : type === 'terms' ? termsEl.current : successEl.current;
    const editorRef = type === 'home' ? editorHomeRef : type === 'terms' ? editorTermsRef : editorSuccessRef;
    if (editorRef.current || !el) return;
    try {
      const path = type === 'home' ? '/portal/template' : type === 'terms' ? '/portal/terms-template' : '/portal/success-template';
      const res = await apiNest.get(path);
      const html = res.data?.html || '';
      editorRef.current = grapesjs.init({
        container: el,
        height: '640px',
        storageManager: { type: null },
        plugins: [presetWebpage],
        deviceManager: { devices: [
          { id: 'desktop', name: 'Desktop', width: '' },
          { id: 'tablet', name: 'Tablet', width: '768px' },
          { id: 'mobile', name: 'Mobile', width: '375px' },
        ]},
        canvas: { scripts: [], styles: [] },
      });
      const ed = editorRef.current;
      ed.Devices.select('mobile');
      // Adiciona bloco de formulário de cadastro (Email/Telefone) na Home
      if (isHome) {
        const bm = ed.BlockManager;
        if (!bm.get('hs-register')) {
          bm.add('hs-register', {
            label: 'Cadastro (Email/Telefone)',
            category: 'Portal',
            content: `<div class="card"><form class="hs-form" action="/api/portal/register" method="post"><h3 class="title">Entrar no Wi‑Fi Free</h3><p class="desc">Preencha seus dados para acesso</p><label>Nome</label><input class="input" type="text" name="name" placeholder="Seu nome"/><label>Email</label><input class="input" type="email" name="email" placeholder="voce@exemplo.com"/><label>Telefone</label><input class="input" type="tel" name="phone" placeholder="(xx) 99999‑9999"/><label style="display:flex;align-items:center;gap:8px"><input type="checkbox" name="accept_terms" required/> Aceito os termos</label><button class="btn" type="submit">Entrar</button></form></div>`
          });
        }
      }
      const defaultHtml = type === 'success'
        ? `<style>${baseCSS}</style><section class="hs-page" style="--accent:${accentColor}"><h3 class="title">Login autorizado</h3><p class="desc">Você já pode usar a internet.</p><a class="btn" href="/portal">Voltar ao portal</a></section>`
        : `<style>${baseCSS}</style><section class="hs-page" style="--accent:${accentColor}"><h3 class="title">Bem‑vindo</h3><p class="desc">Carregue um template social</p></section>`;
      ed.setComponents(html || defaultHtml);
      ed.on('component:selected', (cmp: any) => { setSelectedCmp(cmp); syncPanelTexts(ed); });
      ed.on('component:deselected', () => setSelectedCmp(null));
      applyTheme(ed);
      syncPanelTexts(ed);
      message.success(`Editor ${isHome ? 'Home' : type === 'terms' ? 'Termos' : 'Sucesso'} pronto`);
    } catch (e) { message.error('Falha ao carregar template'); }
  };

  useEffect(() => { if (activeTab === 'editor') initEditor('home'); }, [activeTab]);
  useEffect(() => { if (activeTab === 'terms') initEditor('terms'); }, [activeTab]);
  useEffect(() => { if (activeTab === 'success') initEditor('success'); }, [activeTab]);

  const onSaveTemplate = async (type: 'home' | 'terms' | 'success') => {
    try {
      const ed = type === 'home' ? editorHomeRef.current : type === 'terms' ? editorTermsRef.current : editorSuccessRef.current;
      const html = ed?.getHtml() || '';
      const css = ed?.getCss() || '';
      const full = `<!doctype html><html><head><meta charset=\"utf-8\"/><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"/><style>${css}</style></head><body>${html}</body></html>`;
      const path = type === 'home' ? '/portal/template' : type === 'terms' ? '/portal/terms-template' : '/portal/success-template';
      const res = await apiNest.put(path, { html: full });
      if (res.data?.ok) message.success('Template salvo'); else message.warning('Verifique resposta do servidor');
    } catch (e) { message.error('Falha ao salvar template'); }
  };

  const setDevice = (type: 'home' | 'terms' | 'success', device: 'desktop' | 'tablet' | 'mobile') => {
    const ed = type === 'home' ? editorHomeRef.current : type === 'terms' ? editorTermsRef.current : editorSuccessRef.current;
    ed?.Devices.select(device);
  };

  const reapplyTheme = () => {
    if (editorHomeRef.current) applyTheme(editorHomeRef.current);
    if (editorTermsRef.current) applyTheme(editorTermsRef.current);
    if (editorSuccessRef.current) applyTheme(editorSuccessRef.current);
    message.success('Tema aplicado');
  };

  // Helper para sincronizar os campos laterais com o conteúdo da página
  const syncPanelTexts = (ed: any) => {
    try {
      const root = ed?.DomComponents.getWrapper();
      const tCmp = root.find('.title')[0] || root.find('h1,h2,h3')[0];
      const dCmp = root.find('.desc')[0] || root.find('p')[0];
      setPanelTitle(tCmp ? (tCmp.get('content') || '') : '');
      setPanelDesc(dCmp ? (dCmp.get('content') || '') : '');
    } catch {}
  };
  const setTitleText = (val: string) => {
    const ed = getEditor(); if (!ed) return;
    const root = ed.DomComponents.getWrapper();
    const target = root.find('.title')[0] || root.find('h1,h2,h3')[0];
    if (target) { target.set('content', val); setPanelTitle(val); }
    else { message.warning('Nenhum título encontrado no template'); }
  };
  const setDescText = (val: string) => {
    const ed = getEditor(); if (!ed) return;
    const root = ed.DomComponents.getWrapper();
    const target = root.find('.desc')[0] || root.find('p')[0];
    if (target) { target.set('content', val); setPanelDesc(val); }
    else { message.warning('Nenhuma descrição encontrada no template'); }
  };
  const setButtonLabel = (val: string) => {
    const cmp = selectedCmp; if (!cmp) return;
    const btn = (cmp.is && (cmp.is('link') || cmp.is('button'))) ? cmp : (cmp.find && (cmp.find('a.btn')[0] || cmp.find('button')[0]));
    btn ? btn.set('content', val) : message.warning('Selecione um botão ou bloco com botão');
  };
  const setButtonLink = (val: string) => {
    const cmp = selectedCmp; if (!cmp) return;
    const link = (cmp.is && cmp.is('link')) ? cmp : (cmp.find && cmp.find('a')[0]);
    link ? link.addAttributes({ href: val }) : message.warning('Selecione um link/botão com href');
  };
  const setBlockBgColor = (val: string) => {
    const cmp = selectedCmp; if (!cmp) return;
    const st = cmp.getStyle ? cmp.getStyle() : {};
    cmp.setStyle({ ...st, ['background-color']: val });
  };
  const setBlockTextColor = (val: string) => {
    const cmp = selectedCmp; if (!cmp) return;
    const st = cmp.getStyle ? cmp.getStyle() : {};
    cmp.setStyle({ ...st, color: val });
  };
  const duplicateSelected = () => {
    const ed = getEditor(); if (!ed || !selectedCmp) return;
    ed.runCommand('core:copy'); ed.runCommand('core:paste');
  };
  const deleteSelected = () => { const cmp = selectedCmp; cmp?.remove && cmp.remove(); };

  // Ações do portal
  const checkStatus = async () => { try { const res = await apiPy.get('/portal/status'); message.success(`Portal: ${res.data?.portal || 'ok'}`); } catch { message.error('Falha ao verificar status do portal'); } };
  const simulateLogin = async () => { try { const res = await apiPy.post('/portal/login', { user: 'demo', pass: 'demo' }); message.info(res.data?.result || 'Login (placeholder)'); } catch { message.error('Falha ao simular login'); } };
  const simulateLogout = async () => { try { const res = await apiPy.post('/portal/logout', { user: 'demo' }); message.info(res.data?.result || 'Logout (placeholder)'); } catch { message.error('Falha ao simular logout'); } };

  return (
    <Card title="Portal Cativo">
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
        { key: 'editor', label: 'Editor (Página de Login)', children: (
          <>
            <Alert type="info" message="Construtor leve para hotspot" description="Carregue um template social e ajuste o essencial." />
            <Space style={{ marginTop: 8 }}>
              <Button onClick={() => setDevice('home','desktop')}>Desktop</Button>
              <Button onClick={() => setDevice('home','tablet')}>Tablet</Button>
              <Button onClick={() => setDevice('home','mobile')}>Mobile</Button>
            </Space>
            <Space style={{ marginTop: 8, flexWrap:'wrap' }}>
              <Button onClick={() => loadTemplate('facebook')}>Carregar: Facebook</Button>
              <Button onClick={() => loadTemplate('instagram')}>Carregar: Instagram</Button>
              <Button onClick={() => loadTemplate('twitter')}>Carregar: Twitter</Button>
              <Button onClick={() => loadTemplate('email')}>Carregar: Email</Button>
              <Button onClick={() => loadTemplate('phone')}>Carregar: Telefone</Button>
              <Button onClick={clearPage}>Limpar página</Button>
            </Space>
            {selectedCmp && (
              <div style={{ marginTop: 8, display:'flex', gap:8, flexWrap:'wrap' }}>
                <Button onClick={duplicateSelected}>Duplicar</Button>
                <Button danger onClick={deleteSelected}>Excluir</Button>
              </div>
            )}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:12, alignItems:'start', marginTop: 12 }}>
              <div ref={homeEl} style={{ border: '1px solid #eee', minHeight: 620 }} />
              <Card title="Section Settings" size="small">
                {!selectedCmp && (<Alert type="info" message="Selecione um bloco para editar" />)}
                {selectedCmp && (
                  <div style={{ display:'grid', gap:10 }}>
                    <div>
                      <div style={{ fontWeight:600, marginBottom:4 }}>Título</div>
                      <Input value={panelTitle} placeholder="Seu título" onChange={(e)=>setTitleText(e.target.value)} />
                    </div>
                    <div>
                      <div style={{ fontWeight:600, marginBottom:4 }}>Descrição</div>
                      <Input value={panelDesc} placeholder="Texto descritivo" onChange={(e)=>setDescText(e.target.value)} />
                    </div>
                    <div>
                      <div style={{ fontWeight:600, marginBottom:4 }}>Botão (texto)</div>
                      <Input placeholder="Ex.: Entrar" onChange={(e)=>setButtonLabel(e.target.value)} />
                    </div>
                    <div>
                      <div style={{ fontWeight:600, marginBottom:4 }}>Botão (link)</div>
                      <Input placeholder="https://..." onChange={(e)=>setButtonLink(e.target.value)} />
                    </div>
                    <div>
                      <div style={{ fontWeight:600, marginBottom:4 }}>Cores</div>
                      <Space>
                        <label>BG <input type="color" onChange={(e)=>setBlockBgColor(e.target.value)} /></label>
                        <label>Texto <input type="color" onChange={(e)=>setBlockTextColor(e.target.value)} /></label>
                      </Space>
                    </div>
                  </div>
                )}
              </Card>
            </div>
            <Space style={{ marginTop: 12 }}>
              <Button type="primary" onClick={() => onSaveTemplate('home')}>Salvar Template</Button>
            </Space>
          </>
        )},
        { key: 'terms', label: 'Editor (Termos de Uso)', children: (
          <>
            <Alert type="warning" message="Página obrigatória de Termos" description="Edite os termos que o usuário deve aceitar." />
            <Space style={{ marginTop: 8 }}>
              <Button onClick={() => setDevice('terms','desktop')}>Desktop</Button>
              <Button onClick={() => setDevice('terms','tablet')}>Tablet</Button>
              <Button onClick={() => setDevice('terms','mobile')}>Mobile</Button>
            </Space>
            {selectedCmp && (
              <div style={{ marginTop: 8, display:'flex', gap:8, flexWrap:'wrap' }}>
                <Button onClick={duplicateSelected}>Duplicar</Button>
                <Button danger onClick={deleteSelected}>Excluir</Button>
              </div>
            )}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:12, alignItems:'start', marginTop: 12 }}>
              <div ref={termsEl} style={{ border: '1px solid #eee', minHeight: 620 }} />
              <Card title="Section Settings" size="small">
                {!selectedCmp && (<Alert type="info" message="Selecione um bloco para editar" />)}
                {selectedCmp && (
                  <div style={{ display:'grid', gap:10 }}>
                    <div>
                      <div style={{ fontWeight:600, marginBottom:4 }}>Título</div>
                      <Input value={panelTitle} placeholder="Seu título" onChange={(e)=>setTitleText(e.target.value)} />
                    </div>
                    <div>
                      <div style={{ fontWeight:600, marginBottom:4 }}>Descrição</div>
                      <Input value={panelDesc} placeholder="Texto descritivo" onChange={(e)=>setDescText(e.target.value)} />
                    </div>
                    <div>
                      <div style={{ fontWeight:600, marginBottom:4 }}>Cores</div>
                      <Space>
                        <label>BG <input type="color" onChange={(e)=>setBlockBgColor(e.target.value)} /></label>
                        <label>Texto <input type="color" onChange={(e)=>setBlockTextColor(e.target.value)} /></label>
                      </Space>
                    </div>
                  </div>
                )}
              </Card>
            </div>
            <Space style={{ marginTop: 12 }}>
              <Button type="primary" onClick={() => onSaveTemplate('terms')}>Salvar Termos</Button>
            </Space>
          </>
        )},
        { key: 'success', label: 'Editor (Login Autorizado)', children: (
          <>
            <Alert type="success" message="Página de sucesso" description="Edite a página exibida após autorização do login." />
            <Space style={{ marginTop: 8 }}>
              <Button onClick={() => setDevice('success','desktop')}>Desktop</Button>
              <Button onClick={() => setDevice('success','tablet')}>Tablet</Button>
              <Button onClick={() => setDevice('success','mobile')}>Mobile</Button>
            </Space>
            {selectedCmp && (
              <div style={{ marginTop: 8, display:'flex', gap:8, flexWrap:'wrap' }}>
                <Button onClick={duplicateSelected}>Duplicar</Button>
                <Button danger onClick={deleteSelected}>Excluir</Button>
              </div>
            )}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:12, alignItems:'start', marginTop: 12 }}>
              <div ref={successEl} style={{ border: '1px solid #eee', minHeight: 620 }} />
              <Card title="Section Settings" size="small">
                {!selectedCmp && (<Alert type="info" message="Selecione um bloco para editar" />)}
                {selectedCmp && (
                  <div style={{ display:'grid', gap:10 }}>
                    <div>
                      <div style={{ fontWeight:600, marginBottom:4 }}>Título</div>
                      <Input value={panelTitle} placeholder="Seu título" onChange={(e)=>setTitleText(e.target.value)} />
                    </div>
                    <div>
                      <div style={{ fontWeight:600, marginBottom:4 }}>Descrição</div>
                      <Input value={panelDesc} placeholder="Texto descritivo" onChange={(e)=>setDescText(e.target.value)} />
                    </div>
                    <div>
                      <div style={{ fontWeight:600, marginBottom:4 }}>Cores</div>
                      <Space>
                        <label>BG <input type="color" onChange={(e)=>setBlockBgColor(e.target.value)} /></label>
                        <label>Texto <input type="color" onChange={(e)=>setBlockTextColor(e.target.value)} /></label>
                      </Space>
                    </div>
                  </div>
                )}
              </Card>
            </div>
            <Space style={{ marginTop: 12 }}>
              <Button type="primary" onClick={() => onSaveTemplate('success')}>Salvar Sucesso</Button>
            </Space>
          </>
        )},
      ]} />
      <Space style={{ marginTop: 12 }}>
        <Button onClick={checkStatus}>Status</Button>
        <Button onClick={simulateLogin}>Simular Login</Button>
        <Button onClick={simulateLogout}>Simular Logout</Button>
        <Button onClick={reapplyTheme}>Aplicar Tema</Button>
      </Space>
    </Card>
  );
};

export default Portal;