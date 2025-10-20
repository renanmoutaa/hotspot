import React, { useEffect, useState } from 'react';
import { Card, Form, Input, Button, Space, Select, Alert, Divider, message } from 'antd';
import apiNest from '@/services/apiNest';

const vendorOptions = [
  { label: 'UniFi (Ubiquiti)', value: 'unifi' },
  { label: 'TP‑Link Omada', value: 'omada' },
  { label: 'Huawei', value: 'huawei' },
  { label: 'Cisco', value: 'cisco' },
  { label: 'MikroTik', value: 'mikrotik' },
  { label: 'Aruba', value: 'aruba' },
];

const Wifi: React.FC = () => {
  const [vendor, setVendor] = useState<string>('unifi');
  const [form] = Form.useForm();
  const [loadingCfg, setLoadingCfg] = useState<boolean>(false);
  const [testedOk, setTestedOk] = useState<boolean>(false);

  const [sites, setSites] = useState<any[]>([]);
  const [aps, setAps] = useState<any[]>([]);
  const [ssids, setSsids] = useState<any[]>([]);
  const [selAps, setSelAps] = useState<string[]>([]);
  const [selSsid, setSelSsid] = useState<string | undefined>();

  const loadSaved = async () => {
    try {
      const res = await apiNest.get('/settings');
      const s = res.data || {};
      if (s.controllerVendor) setVendor(s.controllerVendor);
      if (Array.isArray(s.portalApMacs) && s.portalApMacs.length) setSelAps(s.portalApMacs);
      else if (s.portalApMac) setSelAps([s.portalApMac]);
      if (s.portalSsid) setSelSsid(s.portalSsid);
    } catch {}
  };

  const loadUnifiCfg = async () => {
    try {
      const res = await apiNest.get('/unifi/config');
      form.setFieldsValue({
        unifiUrl: res.data?.unifiUrl || '',
        unifiSite: res.data?.unifiSite || 'default',
        unifiUser: res.data?.unifiUser || '',
        unifiPass: res.data?.unifiPass || '',
      });
    } catch { message.error('Falha ao carregar configuração UniFi'); }
    finally { setLoadingCfg(false); }
  };

  const currentSite = () => (form.getFieldValue('unifiSite') as string) || undefined;

  const loadSites = async () => {
    try {
      const res = await apiNest.get('/unifi/sites');
      const items = res.data?.items || [];
      setSites(items);

      // alinhar valor do formulário com o "site code" usado pela API
      const cur = currentSite();
      if (cur) {
        const exists = items.some((it: any) => it.site === cur);
        if (!exists) {
          const guess = items.find((it: any) => it.name === cur || it.desc === cur);
          if (guess?.site) form.setFieldsValue({ unifiSite: guess.site });
        }
      } else if (items.length > 0) {
        form.setFieldsValue({ unifiSite: items[0].site });
      }
    } catch { message.error('Falha ao carregar sites'); }
  };

  const loadAps = async () => {
    try {
      const site = currentSite();
      const res = await apiNest.get('/unifi/aps', site ? { params: { site } } : undefined);
      setAps(res.data?.items || []);
    } catch { message.error('Falha ao carregar APs'); }
  };

  const loadSsids = async () => {
    try {
      const site = currentSite();
      const res = await apiNest.get('/unifi/ssids', site ? { params: { site } } : undefined);
      setSsids(res.data?.items || []);
    } catch { message.error('Falha ao carregar redes Wi‑Fi'); }
  };

  useEffect(() => { loadSaved(); }, []);
  useEffect(() => { if (vendor === 'unifi') loadUnifiCfg(); }, [vendor]);

  const saveUnifiCfg = async () => {
    try {
      const values = await form.validateFields();
      const res = await apiNest.put('/unifi/config', values);
      if (res.data?.ok) message.success('Configuração UniFi salva');
      else message.warning('Salvo, verifique respostas');
    } catch { message.error('Erro ao salvar configuração UniFi'); }
  };

  const testUnifi = async () => {
    try {
      const res = await apiNest.get('/unifi/test');
      if (res.data?.ok) {
        setTestedOk(true);
        message.success('UniFi OK');
        await loadSites();
        await loadAps();
        await loadSsids();
      } else {
        setTestedOk(false);
        message.warning(res.data?.message || 'Configuração incompleta');
      }
    } catch { setTestedOk(false); message.error('Falha ao testar UniFi'); }
  };

  const savePortal = async () => {
    if (vendor !== 'unifi') { message.info('Somente UniFi por enquanto'); return; }
    if (!selAps.length || !selSsid) { message.warning('Selecione os APs e a Rede Wi‑Fi'); return; }
    try {
      const payload = { controllerVendor: vendor, portalApMacs: selAps, portalApMac: selAps[0], portalSsid: selSsid };
      const res = await apiNest.put('/settings', payload);
      if (res.data?.ok) message.success('Configuração do portal salva');
      else message.warning('Resposta recebida, verifique os dados');
    } catch { message.error('Erro ao salvar configuração do portal'); }
  };

  return (
    <Card title="Controladora">
      <Space direction="vertical" style={{ width: '100%' }}>
        <Select options={vendorOptions} value={vendor} onChange={setVendor} style={{ maxWidth: 320 }} />
        {vendor !== 'unifi' && (
          <Alert type="info" showIcon message="Somente UniFi configurável por enquanto" description="As demais controladoras (Omada, Huawei, Cisco, MikroTik, Aruba) ficarão para depois." />
        )}
        {vendor === 'unifi' && (
          <>
            <Form layout="vertical" form={form} disabled={loadingCfg}>
              <Form.Item label="UniFi Controller URL" name="unifiUrl" rules={[{ required: true, message: 'Informe a URL da controladora' }]}>
                <Input placeholder="https://unifi.local:8443" />
              </Form.Item>
              <Form.Item label="Site UniFi" name="unifiSite" rules={[{ required: true, message: 'Informe o site UniFi' }]}>
                {sites.length > 0 ? (
                  <Select
                    placeholder="Selecione um site"
                    options={(sites || []).map((s: any) => ({ label: s.desc || s.name || s.site, value: s.site || s.name }))}
                    showSearch
                  />
                ) : (
                  <Input placeholder="default" />
                )}
              </Form.Item>
              <Form.Item label="Usuário UniFi" name="unifiUser" rules={[{ required: true, message: 'Informe o usuário' }]}> 
                <Input />
              </Form.Item>
              <Form.Item label="Senha UniFi" name="unifiPass" rules={[{ required: true, message: 'Informe a senha' }]}>
                <Input.Password />
              </Form.Item>
              <Space>
                <Button type="primary" onClick={saveUnifiCfg}>Salvar Controladora</Button>
                <Button onClick={testUnifi}>Testar UniFi</Button>
                <Button onClick={loadSites}>Carregar Sites</Button>
              </Space>
            </Form>

            <Divider />
            <Alert type={testedOk ? 'success' : 'warning'} showIcon message={testedOk ? 'UniFi testado com sucesso' : 'Teste UniFi pendente'} />
            <Space direction="vertical" style={{ width: '100%' }}>
              <Select
                mode="multiple"
                placeholder="Selecione os APs"
                value={selAps}
                onChange={setSelAps}
                options={(aps || []).map((a) => ({ label: `${a.name} (${a.ip || '-'})`, value: a.mac || a.name }))}
                style={{ maxWidth: 540 }}
                showSearch
              />
              <Select
                placeholder="Selecione a Rede Wi‑Fi"
                value={selSsid}
                onChange={setSelSsid}
                options={(ssids || []).map((s) => ({ label: s.name, value: s.name }))}
                style={{ maxWidth: 420 }}
                showSearch
              />
              <Space>
                <Button type="primary" onClick={savePortal}>Salvar Captive Portal</Button>
                <Button onClick={() => { loadAps(); loadSsids(); }}>Atualizar listas</Button>
              </Space>
            </Space>
          </>
        )}
      </Space>
    </Card>
  );
};

export default Wifi;