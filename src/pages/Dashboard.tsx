import React, { useEffect, useMemo, useState } from 'react';
import { Card, Space, Typography, Tag, Row, Col, Statistic, Progress, Table, List, Badge } from 'antd';
import { format } from 'date-fns';
import apiNest from '@/services/apiNest';
import apiPy from '@/services/apiPy';

const names = ['Ana', 'Bruno', 'Carla', 'Diego', 'Eduarda', 'Felipe', 'Gabriela', 'Henrique', 'Isabela', 'João'];
const devices = ['Android', 'iPhone', 'Windows', 'MacOS'];

const Dashboard: React.FC = () => {
  const [nestStatus, setNestStatus] = useState<string>('pendente');
  const [pyStatus, setPyStatus] = useState<string>('pendente');
  const [aps, setAps] = useState<any[]>([]);
  const [ssids, setSsids] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const today = format(new Date(), 'dd/MM/yyyy');

  const load = async () => {
    setLoading(true);
    try {
      apiNest.get('/').then((res) => setNestStatus(res.data.status || 'ok')).catch(() => setNestStatus('erro'));
      apiPy.get('/').then((res) => setPyStatus(res.data.status || 'ok')).catch(() => setPyStatus('erro'));
      const [apsRes, ssidRes, clientsRes] = await Promise.all([
        apiNest.get('/unifi/aps').catch(() => ({ data: { items: [] } })),
        apiNest.get('/unifi/ssids').catch(() => ({ data: { items: [] } })),
        apiNest.get('/unifi/clients').catch(() => ({ data: { items: [] } })),
      ]);
      setAps(apsRes.data?.items || []);
      setSsids(ssidRes.data?.items || []);
      setClients(clientsRes.data?.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const apsUp = useMemo(() => (aps || []).filter((a) => a.status === 'up').length, [aps]);
  const freeSsidName = useMemo(() => {
    const guest = (ssids || []).find((s) => s.is_guest) || (ssids || []).find((s) => `${s.name}`.toLowerCase().includes('free'));
    return guest?.name || 'Wi‑Fi Free';
  }, [ssids]);
  const clientsFree = useMemo(() => (clients || []).filter((c) => (c.essid || '').toLowerCase() === freeSsidName.toLowerCase()), [clients, freeSsidName]);

  const mockLogins = useMemo(() => {
    // Gera 10 entradas mock com horário recente
    const now = Date.now();
    return Array.from({ length: 10 }).map((_, i) => ({
      time: new Date(now - i * 1000 * 60 * (2 + Math.random() * 5)),
      name: names[i % names.length],
      device: devices[i % devices.length],
      ssid: freeSsidName,
      ap: (aps[i % (aps.length || 1)]?.name) || 'AP-Guest',
      signal: Math.round(-35 - Math.random() * 40),
    }));
  }, [aps, freeSsidName]);

  const avgSignal = useMemo(() => {
    const arr = clientsFree.map((c) => Number(c.signal || 0)).filter((n) => !Number.isNaN(n));
    if (!arr.length) return 0;
    const sum = arr.reduce((acc, n) => acc + n, 0);
    return Math.round(sum / arr.length);
  }, [clientsFree]);

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Typography.Title level={3}>Dashboard</Typography.Title>

      <Card>
        <Space>
          <span>NestJS:</span>
          <Tag color={nestStatus === 'ok' ? 'green' : nestStatus === 'erro' ? 'red' : 'default'}>{nestStatus}</Tag>
          <span>FastAPI:</span>
          <Tag color={pyStatus === 'ok' ? 'green' : pyStatus === 'erro' ? 'red' : 'default'}>{pyStatus}</Tag>
          <span>Data:</span>
          <Tag>{today}</Tag>
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card title="APs">
            <Row gutter={12}>
              <Col span={12}><Statistic title="Total" value={aps.length} /></Col>
              <Col span={12}><Statistic title="Online" value={apsUp} /></Col>
            </Row>
            <Progress percent={aps.length ? Math.round((apsUp / aps.length) * 100) : 0} status="active" />
            <List size="small" dataSource={aps.slice(0, 5)} renderItem={(a) => (
              <List.Item>
                <Badge status={a.status === 'up' ? 'success' : 'error'} />
                <span style={{ marginLeft: 8 }}>{a.name}</span>
                <span style={{ marginLeft: 'auto', color: '#999' }}>{a.ip}</span>
              </List.Item>
            )} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="Redes Wi‑Fi">
            <Row gutter={12}>
              <Col span={12}><Statistic title="Total" value={ssids.length} /></Col>
              <Col span={12}><Statistic title="Rede Guest" value={freeSsidName} /></Col>
            </Row>
            <List size="small" dataSource={ssids.slice(0, 5)} renderItem={(s) => (
              <List.Item>
                <span>{s.name}</span>
                <span style={{ marginLeft: 8 }}>{s.enabled ? <Tag color="green">habilitada</Tag> : <Tag color="red">desabilitada</Tag>}</span>
                {s.is_guest ? <Tag style={{ marginLeft: 8 }} color="blue">guest</Tag> : null}
                <span style={{ marginLeft: 'auto', color: '#999' }}>{s.security}</span>
              </List.Item>
            )} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="Usuários conectados">
            <Row gutter={12}>
              <Col span={12}><Statistic title="Ativos (todos)" value={clients.length} /></Col>
              <Col span={12}><Statistic title={`Ativos (${freeSsidName})`} value={clientsFree.length} /></Col>
            </Row>
            <Row gutter={12}>
              <Col span={24}><Statistic title="Sinal médio (dBm)" value={avgSignal} /></Col>
            </Row>
            <Progress percent={Math.min(100, Math.max(0, Math.round(((avgSignal + 100) / 100) * 100)))} />
          </Card>
        </Col>
      </Row>

      <Card title={`Últimos logins em ${freeSsidName} (mock estilo PowerBI)`} extra={<Tag color="geekblue">Mock</Tag>}>
        <Table
          rowKey={(r) => `${r.name}-${r.time.getTime()}`}
          dataSource={mockLogins}
          pagination={{ pageSize: 5 }}
          columns={[
            { title: 'Hora', dataIndex: 'time', render: (t) => format(t, 'HH:mm') },
            { title: 'Usuário', dataIndex: 'name' },
            { title: 'Dispositivo', dataIndex: 'device' },
            { title: 'AP', dataIndex: 'ap' },
            { title: 'SSID', dataIndex: 'ssid' },
            { title: 'Sinal (dBm)', dataIndex: 'signal' },
          ]}
        />
      </Card>
    </Space>
  );
};

export default Dashboard;