import { Layers, ShieldCheck, Store, TrendingUp } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-12 bg-background">
      {/* Left side: Hero branding panel */}
      <div className="hidden lg:flex lg:col-span-5 relative flex-col justify-between p-12 text-white overflow-hidden bg-zinc-950">
        {/* CSS-only Modern Tech Grid & Radial Glow Background */}
        <div className="absolute inset-0 z-0 bg-zinc-950">
          {/* Subtle grid lines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[32px_32px]" />

          {/* Radial vignette mask for the grid */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#09090b_90%)]" />

          {/* Glowing accent orbs */}
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        </div>

        {/* Brand Header */}
        <div className="relative z-20 flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 border border-primary/40 backdrop-blur-md shadow-[0_0_15px_rgba(139,92,246,0.3)]">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-linear-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            AlgoRetail
          </span>
        </div>

        {/* Branding Message */}
        <div className="relative z-20 my-auto max-w-md space-y-6">
          <div className="space-y-3">
            <span className="inline-flex items-center rounded-full bg-primary/15 border border-primary/20 px-3 py-1 text-xs font-medium text-primary backdrop-blur-md">
              Backoffice Console
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight leading-tight bg-linear-to-br from-white to-zinc-400 bg-clip-text text-transparent">
              Retail Catalog & POS Sync
            </h1>
          </div>
          <p className="text-zinc-300 leading-relaxed text-sm">
            Manage your store's digital catalog, coordinate stock levels, audit product updates, and
            monitor transactions in real-time.
          </p>

          {/* Key Value Props */}
          <div className="space-y-4 pt-4 border-t border-zinc-800/40">
            <div className="flex items-start space-x-3">
              <Store className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-zinc-100">Catalog & Inventory Sync</h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Organize product categories, manage stock levels, and upload catalogs via CSV
                  instantly.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Layers className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-zinc-100">POS Transaction Tracking</h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Track transactions and register orders coming from your desktop POS terminals in
                  real-time.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <ShieldCheck className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-zinc-100">Sales Reports & Auditing</h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Monitor revenue analytics, filter store reports, and audit historical product
                  changes.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-20 text-xs text-zinc-500">
          &copy; {new Date().getFullYear()} AlgoDig Inc. All rights reserved.
        </div>
      </div>

      {/* Right side: Login form */}
      <div className="lg:col-span-7 flex items-center justify-center p-6 md:p-12 bg-zinc-950/5 dark:bg-zinc-950/20">
        <div className="w-full max-w-md bg-card border border-border/60 rounded-2xl shadow-xl shadow-zinc-950/5 dark:shadow-zinc-950/50 overflow-hidden transition-all duration-300 hover:shadow-2xl">
          {children}
        </div>
      </div>
    </div>
  );
}
