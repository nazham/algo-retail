import { HashRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import PosPage from './pages/PosPage';
import SettingsPage from './pages/SettingsPage';

function App() {
  return (
    // We use HashRouter for Electron apps because "file://" urls don't support normal history well
    <HashRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<PosPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/orders" element={<div className="p-10">Orders Coming Soon</div>} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
