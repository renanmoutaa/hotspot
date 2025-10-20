import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Space, message } from 'antd';
import apiNest from '../services/apiNest';

const AccessPoints: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiNest.get('/unifi/aps');
      setItems(res.data?.items || []);
    } catch (e) {
      message.error('Falha ao carregar APs');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <Card title="Access Points" extra={<Space><Button onClick={load}>Atualizar</Button></Space>}>
      <Table rowKey={(r) => r.mac || r.ip || r.name} loading={loading} dataSource={items}
        columns={[
          { title: 'Nome', dataIndex: 'name' },
          { title: 'IP', dataIndex: 'ip' },
          { title: 'MAC', dataIndex: 'mac' },
          { title: 'Modelo', dataIndex: 'model' },
          { title: 'Versão', dataIndex: 'version' },
          { title: 'Status', dataIndex: 'status' }
        ]}
      />
    </Card>
  );
};

export default AccessPoints;