import React from 'react';
import { Card, Form, Input, Button, Space } from 'antd';
import { motion } from 'framer-motion';

const Login: React.FC = () => {
  const onFinish = (values: any) => {
    console.log('Login submit:', values);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <Card title="Entrar" style={{ maxWidth: 400, margin: '0 auto' }}>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item label="Usuário" name="username" rules={[{ required: true, message: 'Informe o usuário' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Senha" name="password" rules={[{ required: true, message: 'Informe a senha' }]}>
            <Input.Password />
          </Form.Item>
          <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button htmlType="submit" type="primary">Entrar</Button>
          </Space>
        </Form>
      </Card>
    </motion.div>
  );
};

export default Login;