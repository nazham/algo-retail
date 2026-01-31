'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, Upload, Settings, LogOut, FileText } from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';
import { Button } from '@repo/ui/components/ui/button';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { ModeToggle } from '@repo/ui/components/mode-toggle';

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
    subItems: [
      {
        title: 'Bulk Upload',
        href: '/dashboard/products/upload',
        icon: Upload,
      },
    ],
  },
  {
    title: 'Orders',
    href: '/dashboard/orders',
    icon: FileText,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push('/login');
  };

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card">
      <div className="flex h-14 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <Package className="h-6 w-6" />
          <span>Algo Retail</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-4">
        <nav className="grid items-start px-4 text-sm font-medium">
          {sidebarItems.map((item, index) => (
            <div key={index}>
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                  pathname === item.href && 'bg-muted text-primary',
                  pathname.startsWith(item.href) && item.href !== '/dashboard' && 'text-primary',
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>
              {item.subItems && (
                <div className="ml-6 mt-1 space-y-1 border-l pl-3">
                  {item.subItems.map((subItem, subIndex) => (
                    <Link
                      key={subIndex}
                      href={subItem.href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                        pathname === subItem.href && 'bg-muted text-primary',
                      )}
                    >
                      <subItem.icon className="h-4 w-4" />
                      {subItem.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
      <div className="border-t p-4 flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          className="flex-1 justify-start gap-3 text-muted-foreground hover:text-red-500"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
        <ModeToggle />
      </div>
    </div>
  );
}
