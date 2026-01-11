import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Settings, ShoppingCart } from 'lucide-react';
import { clsx } from 'clsx';
import Header from './Header';
import { ErrorBoundary } from '../ErrorBoundary';

export default function MainLayout() {
  const navItems = [
    { icon: ShoppingCart, label: 'Checkout', path: '/' },
    { icon: LayoutDashboard, label: 'Orders', path: '/orders' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar (Left) */}
      <aside className="w-20 bg-white border-r border-gray-200 flex flex-col items-center py-6 gap-4 shadow-sm z-20">
        <div className="mb-4 bg-blue-600 p-2 rounded-lg">
          <span className="text-white font-bold text-xl">AR</span>
        </div>

        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              clsx(
                'p-3 rounded-xl transition-all duration-200 group relative',
                isActive
                  ? 'bg-blue-50 text-blue-600 shadow-sm'
                  : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600',
              )
            }
          >
            <item.icon size={24} strokeWidth={2} />
            <span className="absolute left-16 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
              {item.label}
            </span>
          </NavLink>
        ))}
      </aside>

      {/* Right Side Wrapper (Header + Content) */}
      <div className="flex flex-1 flex-col h-screen overflow-hidden">
        {/* 1. The Header (Top) */}
        <Header />

        {/* 2. Scrollable Content Area (Bottom) */}
        <main className="flex-1 overflow-auto">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
