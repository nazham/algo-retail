import { useEffect, useState } from 'react';
import { LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Header() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    // 1. Get User from Session
    const stored = sessionStorage.getItem('algo_user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('algo_user');
    navigate('/login');
  };

  return (
    <header className="flex h-16 items-center justify-between bg-white px-6 shadow-sm">
      {/* Left: Brand */}
      <div className="text-xl font-bold text-blue-600">Algo Retail</div>

      {/* Right: User Info */}
      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <User size={16} />
            </div>
            <div className="flex flex-col items-end leading-tight">
              <span>{user.name}</span>
              <span className="text-xs text-gray-400">{user.role}</span>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
          title="Logout"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}
