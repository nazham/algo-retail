import { useEffect, useState } from 'react';
import { LogOut, User, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ModeToggle } from '@repo/ui/components/mode-toggle';
import { Button } from '@repo/ui/components/ui/button';
import { EndOfDayModal } from '../../features/pos/components/EndOfDayModal';
import { SyncStatus } from '../SyncStatus';

export default function Header() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [isEodOpen, setIsEodOpen] = useState(false);

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
    <>
      <header className="flex h-16 items-center justify-between bg-card px-6 shadow-sm">
        {/* Left: Brand */}
        <div className="flex items-center gap-4">
          <div className="text-xl font-bold text-primary">Algo Retail</div>
          <SyncStatus />
        </div>

        {/* Right: User Info */}
        <div className="flex items-center gap-4">
          <ModeToggle />

          {/* Close Shift Button - Only for CASHIER */}
          {user?.role === 'CASHIER' ||
            (user?.role === 'ADMIN' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEodOpen(true)}
                className="gap-2"
              >
                <DollarSign size={16} />
                Close Shift
              </Button>
            ))}

          {user && (
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <User size={16} />
              </div>
              <div className="flex flex-col items-end leading-tight">
                <span>{user.name}</span>
                <span className="text-xs text-muted-foreground">{user.role}</span>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* EOD Modal */}
      <EndOfDayModal isOpen={isEodOpen} onClose={() => setIsEodOpen(false)} />
    </>
  );
}
