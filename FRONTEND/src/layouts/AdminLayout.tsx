import React from 'react';
import { Layout, Menu, theme } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  GiftOutlined,
  WifiOutlined,
  BarChartOutlined,
  SettingOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { Link, useLocation } from 'react-router-dom';

const { Header, Sider, Content } = Layout;

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const selectedKey = location.pathname || '/';
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const items = [
    { key: '/', icon: <DashboardOutlined />, label: <Link to="/">Dashboard</Link> },
    { key: '/users', icon: <UserOutlined />, label: <Link to="/users">Usuários</Link> },
    { key: '/vouchers', icon: <GiftOutlined />, label: <Link to="/vouchers">Vouchers</Link> },
    { key: '/wifi', icon: <WifiOutlined />, label: <Link to="/wifi">Controladora</Link> },
    { key: '/reports', icon: <BarChartOutlined />, label: <Link to="/reports">Relatórios</Link> },
    { key: '/settings', icon: <SettingOutlined />, label: <Link to="/settings">Configurações</Link> },
    { key: '/portal', icon: <GlobalOutlined />, label: <Link to="/portal">Portal Cativo</Link> },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" collapsedWidth={64}>
        <div style={{ height: 48, margin: 16, color: '#fff', fontWeight: 600 }}>Hotspot</div>
        <Menu theme="dark" mode="inline" selectedKeys={[selectedKey]} items={items} />
      </Sider>
      <Layout>
        <Header style={{ background: colorBgContainer, paddingInline: 24 }}>Admin</Header>
        <Content style={{ margin: 24 }}>
          <div style={{ padding: 24, minHeight: 360, background: colorBgContainer }}>{children}</div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;