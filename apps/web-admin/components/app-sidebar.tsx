'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Settings,
  LogOut,
  FileText,
  FolderOpen,
  Menu,
  ChevronLeft,
  ChevronRight,
  Store,
} from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';
import { Button } from '@repo/ui/components/ui/button';
import { signOutAndRedirect } from '@/lib/auth-utils';
import { ModeToggle } from '@repo/ui/components/mode-toggle';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@repo/ui/components/ui/tooltip';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from '@repo/ui/components/ui/sheet';
import { useSession } from '@/lib/auth-client';
import { useTenant } from '@/hooks/use-tenant';

const sidebarItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Products',
    href: '/dashboard/products',
    icon: Package,
  },
  {
    title: 'Categories',
    href: '/dashboard/categories',
    icon: FolderOpen,
  },
  {
    title: 'Orders',
    href: '/dashboard/orders',
    icon: FileText,
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
];

interface SidebarNavProps {
  isCollapsed?: boolean;
  pathname: string;
  onNavigate?: () => void;
}

function SidebarNav({ isCollapsed, pathname, onNavigate }: SidebarNavProps) {
  return (
    <nav className={cn('grid items-start gap-1', isCollapsed ? 'px-2' : 'px-4')}>
      {sidebarItems.map((item, index) => {
        const isActive =
          pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/dashboard');

        const LinkContent = (
          <Link
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
              isActive && 'bg-muted text-primary',
              isCollapsed && 'justify-center px-2',
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!isCollapsed && <span>{item.title}</span>}
          </Link>
        );

        if (isCollapsed) {
          return (
            <Tooltip key={index} delayDuration={0}>
              <TooltipTrigger asChild>{LinkContent}</TooltipTrigger>
              <TooltipContent side="right" className="flex items-center gap-4">
                {item.title}
              </TooltipContent>
            </Tooltip>
          );
        }

        return <div key={index}>{LinkContent}</div>;
      })}
    </nav>
  );
}

/** Compact user/tenant info section */
function TenantBadge({
  tenantName,
  userName,
  isCollapsed,
}: {
  tenantName: string | null;
  userName: string | null;
  isCollapsed?: boolean;
}) {
  if (isCollapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <div className="flex items-center justify-center py-2">
            <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
              <Store className="h-4 w-4 text-primary" />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <div className="text-xs">
            <p className="font-medium">{tenantName || 'No Business'}</p>
            {userName && <p className="text-muted-foreground">{userName}</p>}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2">
      <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
        <Store className="h-4 w-4 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{tenantName || 'No Business'}</p>
        {userName && <p className="text-xs text-muted-foreground truncate">{userName}</p>}
      </div>
    </div>
  );
}

interface AppSidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function AppSidebar({ isCollapsed = false, onToggleCollapse }: AppSidebarProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { data: session } = useSession();
  const { tenant } = useTenant();

  const userName = (session?.user as any)?.name || null;
  const tenantName = tenant?.name || null;

  const toggleCollapse = () => {
    onToggleCollapse?.();
  };

  const handleSignOut = () => {
    signOutAndRedirect('/login');
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="flex h-14 items-center gap-4 border-b bg-background px-6 md:hidden fixed top-0 left-0 right-0 z-50">
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="-ml-3 h-10 w-10 shrink-0">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Navigation Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col w-[280px] p-0">
            <div className="flex h-14 items-center border-b px-6">
              <SheetTitle className="flex items-center gap-2 font-semibold">
                <Package className="h-6 w-6" />
                <span>{tenantName || 'Algo Retail'}</span>
              </SheetTitle>
              <SheetDescription className="sr-only">
                Navigation menu for Algo Retail admin dashboard.
              </SheetDescription>
            </div>
            <div className="px-2 pt-3">
              <TenantBadge tenantName={tenantName} userName={userName} />
            </div>
            <div className="flex-1 overflow-auto py-4">
              <SidebarNav pathname={pathname} onNavigate={() => setIsMobileOpen(false)} />
            </div>
            <div className="mt-auto border-t p-4 flex justify-between items-center bg-muted/20">
              <Button
                variant="ghost"
                size="sm"
                className="justify-start gap-2 text-muted-foreground hover:text-red-500 w-full"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </Button>
              <ModeToggle />
            </div>
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2 font-semibold">
          <Package className="h-6 w-6" />
          <span>{tenantName || 'Algo Retail'}</span>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <TooltipProvider>
        <div
          className={cn(
            'hidden md:flex flex-col border-r bg-card transition-all duration-300 ease-in-out h-screen fixed left-0 top-0 z-40',
            isCollapsed ? 'w-[70px]' : 'w-64',
          )}
        >
          <div
            className={cn(
              'flex h-14 items-center border-b px-4',
              isCollapsed ? 'justify-center' : 'justify-between',
            )}
          >
            {!isCollapsed && (
              <Link href="/dashboard" className="flex items-center gap-2 font-semibold truncate">
                <Package className="h-6 w-6 shrink-0" />
                <span>Algo Retail</span>
              </Link>
            )}
            {isCollapsed && (
              <Link href="/dashboard" className="flex justify-center w-full">
                <Package className="h-6 w-6 shrink-0" />
              </Link>
            )}
          </div>

          {/* Tenant/User Badge */}
          <div className={cn('border-b py-2', isCollapsed ? 'px-2' : '')}>
            <TenantBadge tenantName={tenantName} userName={userName} isCollapsed={isCollapsed} />
          </div>

          <div className="flex-1 overflow-auto py-4">
            <SidebarNav isCollapsed={isCollapsed} pathname={pathname} />
          </div>

          <div
            className={cn(
              'border-t p-4 flex items-center gap-2',
              isCollapsed ? 'flex-col justify-center' : 'justify-between',
            )}
          >
            {!isCollapsed && (
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 justify-start gap-2 text-muted-foreground hover:text-red-500 overflow-hidden"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 shrink-0" />
                <span className="truncate">Sign Out</span>
              </Button>
            )}
            {isCollapsed && (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground hover:text-red-500"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Sign Out</TooltipContent>
              </Tooltip>
            )}
            <ModeToggle />
          </div>
          {/* Collapse Toggle */}
          <div className="absolute -right-3 top-20 z-50">
            <Button
              variant="outline"
              size="icon"
              className="h-6 w-6 rounded-full border shadow-md bg-background text-muted-foreground hover:text-foreground"
              onClick={toggleCollapse}
            >
              {isCollapsed ? (
                <ChevronRight className="h-3 w-3" />
              ) : (
                <ChevronLeft className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
      </TooltipProvider>
    </>
  );
}
