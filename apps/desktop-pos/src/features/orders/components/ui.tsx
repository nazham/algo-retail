import { type ElementType } from 'react';
import { clsx } from 'clsx';
import { Eye, Printer, RefreshCcw, MoreHorizontal } from 'lucide-react';

// --- 1. Original Components (Restored) ---

type TableHeaderProps = {
  label: string;
  align?: 'left' | 'center' | 'right';
};

export function TableHeader({ label, align = 'left' }: TableHeaderProps) {
  return (
    <th
      className={`p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-${align}`}
    >
      {label}
    </th>
  );
}

type StatCardProps = {
  title: string;
  value: string;
  icon: ElementType;
  trend?: string;
  variant: 'blue' | 'purple' | 'indigo' | 'orange';
};

export function StatCard({ title, value, icon: Icon, trend, variant }: StatCardProps) {
  const colorStyles: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <div className="bg-card p-5 rounded-xl shadow-sm border flex items-center justify-between">
      <div>
        <div className="text-muted-foreground text-sm font-medium mb-1">{title}</div>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {trend && (
          <div className="text-xs text-emerald-600 font-medium mt-1">{trend} vs last month</div>
        )}
      </div>
      <div className={clsx('p-3 rounded-xl', colorStyles[variant])}>
        <Icon size={24} strokeWidth={2} />
      </div>
    </div>
  );
}

type FilterButtonProps = {
  icon: ElementType;
  label: string;
  // Added onClick support just in case, though not strictly required for this task
  onClick?: () => void;
};

export function FilterButton({ icon: Icon, label, onClick }: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 bg-card border text-muted-foreground rounded-lg text-sm font-medium hover:bg-muted/50 hover:border-input transition-all"
    >
      <Icon size={16} />
      <span>{label}</span>
    </button>
  );
}

export function PaymentBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    Card: 'bg-blue-100 text-blue-700 border-blue-200',
    Cash: 'bg-green-100 text-green-700 border-green-200',
    Qr: 'bg-purple-100 text-purple-700 border-purple-200',
  };
  const activeStyle = styles[type] || styles['Cash']; // Fallback

  return (
    <span className={clsx('px-2.5 py-1 rounded-md text-xs font-bold border', activeStyle)}>
      {type}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  // Normalize string case
  const s = status.toLowerCase();

  let style = 'bg-muted text-muted-foreground border';
  let dotColor = 'bg-gray-400';

  if (s === 'completed' || s === 'paid') {
    style = 'bg-emerald-50 text-emerald-600 border-emerald-100';
    dotColor = 'bg-emerald-500';
  } else if (s === 'refunded') {
    style = 'bg-red-50 text-red-600 border-red-100';
    dotColor = 'bg-red-500';
  } else if (s === 'pending') {
    style = 'bg-amber-50 text-amber-600 border-amber-100';
    dotColor = 'bg-amber-500';
  }

  return (
    <span
      className={clsx(
        'flex items-center w-fit gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
        style,
      )}
    >
      <span className={clsx('w-1.5 h-1.5 rounded-full', dotColor)}></span>
      <span className="capitalize">{status}</span>
    </span>
  );
}

// --- 2. Updated Components for the Feature ---

type MenuItemProps = {
  icon: ElementType;
  label: string;
  variant?: 'default' | 'destructive';
  onClick?: () => void; // <--- ADDED THIS
};

export function MenuItem({ icon: Icon, label, variant = 'default', onClick }: MenuItemProps) {
  return (
    <button
      onClick={onClick} // <--- CONNECTED HERE
      className={clsx(
        'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors',
        variant === 'destructive'
          ? 'text-destructive hover:bg-destructive/10'
          : 'text-foreground hover:bg-muted/50',
      )}
    >
      <Icon size={16} />
      {label}
    </button>
  );
}

type MenuProps = {
  orderId: string;
  activeMenu: string | null;
  toggleMenu: (id: string) => void;
  onViewDetails: () => void; // <--- ADDED THIS
};

export function OrderActionsMenu({ orderId, activeMenu, toggleMenu, onViewDetails }: MenuProps) {
  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleMenu(orderId);
        }}
        className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all"
      >
        <MoreHorizontal size={18} />
      </button>

      {/* Dropdown Menu */}
      {activeMenu === orderId && (
        <div className="absolute right-10 mt-1 w-48 bg-card rounded-lg shadow-xl border z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="p-1">
            {/* VIEW DETAILS BUTTON */}
            <MenuItem
              icon={Eye}
              label="View Details"
              onClick={() => {
                onViewDetails(); // Trigger the popup
                toggleMenu(orderId); // Close the menu
              }}
            />
            <MenuItem icon={Printer} label="Reprint Receipt" />
            <div className="h-px bg-border my-1"></div>
            <MenuItem icon={RefreshCcw} label="Refund" variant="destructive" />
          </div>
        </div>
      )}
    </>
  );
}
