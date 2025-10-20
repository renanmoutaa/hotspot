import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Space, message, Tag } from 'antd';
import apiNest from '../services/apiNest';

const AccessPoints: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [site, setSite] = useState<string>('default');

  const load = async (targetSite?: string) => {
    const effectiveSite = targetSite ?? site ?? 'default';
    setLoading(true);
    try {
      const res = await apiNest.get('/unifi/aps', { params: { site: effectiveSite } });
      setItems(res.data?.items || []);
    } catch (e) {
      message.error('Falha ao carregar APs');
    } finally { setLoading(false); }
  };

  const init = async () => {
    try {
      const res = await apiNest.get('/unifi/config');
      const s = res.data || {};
      const cfgSite = s.unifiSite || 'default';
      setSite(cfgSite);
      await load(cfgSite);
    } catch (e) {
      setSite('default');
      await load('default');
    }
  };

  useEffect(() => { init(); }, []);

  return (
    <Card title={`Access Points — Site: ${site}`} extra={<Space><Button onClick={() => load()}>Atualizar</Button></Space>}>
      <Table rowKey={(r) => r.mac || r.ip || r.name} loading={loading} dataSource={items}
        columns={[
          { title: 'Nome', dataIndex: 'name' },
          { title: 'IP', dataIndex: 'ip' },
          { title: 'MAC', dataIndex: 'mac' },
          { title: 'Modelo', dataIndex: 'model' },
          { title: 'Versão', dataIndex: 'version' },
          { title: 'Status', dataIndex: 'status' },
          { title: 'Portal', dataIndex: 'is_portal', render: (v: boolean) => v ? <Tag color="blue">Portal</Tag> : <Tag>Normal</Tag> }
        ]}
      />
    </Card>
  );
};

export default AccessPoints;