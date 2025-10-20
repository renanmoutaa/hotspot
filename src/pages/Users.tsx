import React, { useEffect, useMemo, useState } from 'react';
import { Card, Table, Button, Space, Tag } from 'antd';
import apiNest from '@/services/apiNest';

const Users: React.FC = () => {
  const [clients, setClients] = useState<any[]>([]);
  const [regs, setRegs] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState<boolean>(false);

  const load = async () => {
    setLoading(true);
    try {
      const [cRes, rRes, sRes] = await Promise.all([
        apiNest.get('/unifi/clients'),
        apiNest.get('/portal/registrations'),
        apiNest.get('/settings'),
      ]);
      setClients(cRes.data?.items || []);
      setRegs(rRes.data?.items || []);
      setSettings(sRes.data || {});
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const selectedSsid: string | undefined = settings?.portalSsid;
  const selectedAps: string[] = Array.isArray(settings?.portalApMacs)
    ? settings.portalApMacs
    : (settings?.portalApMac ? [settings.portalApMac] : []);

  const enriched = useMemo(() => {
    const filtered = (clients || []).filter((c) => {
      const ssidOk = selectedSsid ? (c.essid || '').toLowerCase() === selectedSsid.toLowerCase() : true;
      const apOk = selectedAps.length ? selectedAps.includes(c.ap_mac) : true;
      return ssidOk && apOk;
    });
    return filtered.map((c) => {
      const reg = (regs || []).find((r) => (r.client_mac || '').toLowerCase() === (c.mac || '').toLowerCase()) || null;
      return { ...c, reg };
    });
  }, [clients, regs, selectedSsid, selectedAps]);

  const columns = [
    { title: 'Nome do dispositivo', dataIndex: 'hostname', key: 'hostname' },
    { title: 'MAC', dataIndex: 'mac', key: 'mac' },
    { title: 'IP', dataIndex: 'ip', key: 'ip' },
    { title: 'SSID', dataIndex: 'essid', key: 'essid' },
    { title: 'AP (MAC)', dataIndex: 'ap_mac', key: 'ap_mac' },
    { title: 'Sinal (dBm)', dataIndex: 'signal', key: 'signal', render: (v: any) => <span>{v}</span> },
    { title: 'Autorizado', dataIndex: 'authorized', key: 'authorized', render: (v: any) => v ? <Tag color="green">Sim</Tag> : <Tag color="red">Não</Tag> },
    { title: 'Cadastro: Nome', key: 'reg_name', render: (_: any, row: any) => row.reg?.name || '—' },
    { title: 'Cadastro: Email', key: 'reg_email', render: (_: any, row: any) => row.reg?.email || '—' },
    { title: 'Cadastro: Telefone', key: 'reg_phone', render: (_: any, row: any) => row.reg?.phone || '—' },
    { title: 'Aceitou Termos', key: 'reg_terms', render: (_: any, row: any) => row.reg ? (row.reg.accept_terms ? <Tag color="blue">Sim</Tag> : <Tag>Não</Tag>) : <Tag>—</Tag> },
  ];

  return (
    <Card title="Usuários conectados" extra={<Space><Button onClick={load} loading={loading}>Atualizar</Button></Space>}>
      <Space style={{ marginBottom: 12 }}>
        {selectedSsid ? <Tag color="geekblue">SSID: {selectedSsid}</Tag> : null}
        {selectedAps?.length ? <Tag color="purple">APs: {selectedAps.join(', ')}</Tag> : <Tag>APs: todos</Tag>}
      </Space>
      <Table rowKey={(r) => r.mac || r.hostname} dataSource={enriched} columns={columns} pagination={{ pageSize: 10 }} />
    </Card>
  );
};

export default Users;