import React, { useEffect } from 'react';
import { Card, Form, Input, Button, message, Space } from 'antd';
import apiNest from '../services/apiNest';
import apiPy from '../services/apiPy';

const Settings: React.FC = () => {
  const [form] = Form.useForm();

  useEffect(() => {
    apiNest.get('/settings').then(res => {
      form.setFieldsValue(res.data);
    }).catch(() => message.error('Falha ao carregar configurações'));
  }, []);

  const onSave = async () => {
    try {
      const values = await form.validateFields();
      const res = await apiNest.put('/settings', values);
      if (res.data?.ok) message.success('Configurações salvas');
      else message.warning('Salvo, verifique respostas');
    } catch (e) {
      message.error('Erro ao salvar configurações');
    }
  };

  const testRadius = async () => {
    try {
      const res = await apiPy.get('/portal/status');
      if (res.data?.ok) message.success('Portal/RADIUS OK');
      else message.info('Portal status verificado');
    } catch (e) { message.error('Falha ao testar Portal/RADIUS'); }
  };

  return (
    <Card title="Configurações">
      <Form layout="vertical" form={form}>
        {/* Campos de UniFi removidos — agora em Wi‑Fi > Controladoras */}
        <Form.Item label="FreeRADIUS Host" name="radiusHost"><Input placeholder="localhost" /></Form.Item>
        <Form.Item label="FreeRADIUS Secret" name="radiusSecret"><Input.Password /></Form.Item>
        <Space>
          <Button type="primary" onClick={onSave}>Salvar</Button>
          <Button onClick={testRadius}>Testar RADIUS</Button>
        </Space>
      </Form>
    </Card>
  );
};

export default Settings;