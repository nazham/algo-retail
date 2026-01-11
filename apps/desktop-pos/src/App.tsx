import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import PosPage from './pages/PosPage';
import SettingsPage from './pages/SettingsPage';
import OrderPage from './pages/OrderPage';
import LoginPage from './pages/LoginPage';
import type { JSX } from 'react';
import { Toaster } from '@repo/ui/components/ui/sonner';

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const user = sessionStorage.getItem('algo_user');
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  return (
    // We use HashRouter for Electron apps because "file://" urls don't support normal history well
    <HashRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<PosPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/orders" element={<OrderPage />} />
        </Route>
      </Routes>
      <Toaster />
    </HashRouter>
  );
}

export default App;
