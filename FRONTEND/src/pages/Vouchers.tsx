import React from 'react';
import { Card, Table, Button, Space } from 'antd';

const Vouchers: React.FC = () => {
  return (
    <Card title="Vouchers">
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary">Criar Voucher</Button>
      </Space>
      <Table rowKey="id" dataSource={[]} columns={[{ title: 'Código', dataIndex: 'code' }, { title: 'Expira em', dataIndex: 'expiresAt' }]} />
    </Card>
  );
};

export default Vouchers;