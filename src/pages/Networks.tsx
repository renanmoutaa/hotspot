import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Space, Tag, message } from 'antd';
import apiNest from '@/services/apiNest';

const Networks: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiNest.get('/unifi/ssids');
      setItems(res.data?.items || []);
    } catch (e) {
      message.error('Falha ao carregar redes Wi‑Fi');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <Card title="Redes Wi‑Fi" extra={<Space><Button onClick={load}>Atualizar</Button></Space>}>
      <Table rowKey={(r) => r.name} loading={loading} dataSource={items}
        columns={[
          { title: 'Nome', dataIndex: 'name' },
          { title: 'Status', dataIndex: 'enabled', render: (v: boolean) => v ? <Tag color="green">habilitada</Tag> : <Tag color="red">desabilitada</Tag> },
          { title: 'Segurança', dataIndex: 'security' },
          { title: 'VLAN', dataIndex: 'vlan_id', render: (v: any) => v ?? '-' },
          { title: 'Guest', dataIndex: 'is_guest', render: (v: boolean) => v ? <Tag color="blue">guest</Tag> : '-' },
        ]}
      />
    </Card>
  );
};

export default Networks;