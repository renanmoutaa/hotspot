import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { motion } from 'framer-motion';
import AdminLayout from '@/layouts/AdminLayout';
import Dashboard from '@/pages/Dashboard';
import Users from '@/pages/Users';
import Vouchers from '@/pages/Vouchers';
import AccessPoints from '@/pages/AccessPoints';
import Reports from '@/pages/Reports';
import Settings from '@/pages/Settings';
import Portal from '@/pages/Portal';
import Login from './pages/Login';
import Networks from '@/pages/Networks';
import Wifi from '@/pages/Wifi';

const PageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
    {children}
  </motion.div>
);

const App: React.FC = () => {
  return (
    <AdminLayout>
      <PageWrapper>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/users" element={<Users />} />
          <Route path="/vouchers" element={<Vouchers />} />
          {/* Mantemos rotas diretas (legacy) para compatibilidade, mas o menu aponta para /wifi */}
          <Route path="/aps" element={<AccessPoints />} />
          <Route path="/networks" element={<Networks />} />
          <Route path="/wifi" element={<Wifi />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/portal" element={<Portal />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </PageWrapper>
    </AdminLayout>
  );
};

export default App;