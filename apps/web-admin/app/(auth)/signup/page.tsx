'use client';

import { authClient } from '@/lib/auth-client';
import { redirectByRole } from '@/lib/auth-utils';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Label } from '@repo/ui/components/ui/label';
import { Eye, EyeOff, Loader2, Lock, Mail, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authClient.signUp.email({
        email,
        password,
        name,
      });

      if (res.error) {
        throw res.error;
      }

      // Redirect based on role (new users go to waitlist, but respects callbackUrl if approved)
      await redirectByRole(router, callbackUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="p-8 pb-4 text-center space-y-2">
        <h2 className="text-2xl font-bold tracking-tight bg-linear-to-br from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
          Create Account
        </h2>
        <p className="text-sm text-muted-foreground max-w-[280px] mx-auto leading-relaxed">
          Register to begin setting up your retail workspace
        </p>
      </div>

      <form onSubmit={handleSignUp} className="p-8 pt-4 space-y-6">
        <div className="space-y-4">
          {/* Name field */}
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <div className="relative">
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                className="peer pl-10 h-11 border-border/80 rounded-xl focus-visible:ring-primary/20 focus-visible:border-primary transition-all duration-200"
              />
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 transition-colors peer-focus:text-primary pointer-events-none" />
            </div>
          </div>

          {/* Email field */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="example@yourdomain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="peer pl-10 h-11 border-border/80 rounded-xl focus-visible:ring-primary/20 focus-visible:border-primary transition-all duration-200"
              />
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 transition-colors peer-focus:text-primary pointer-events-none" />
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="peer pl-10 pr-10 h-11 border-border/80 rounded-xl focus-visible:ring-primary/20 focus-visible:border-primary transition-all duration-200"
              />
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 transition-colors peer-focus:text-primary pointer-events-none" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground focus:outline-none transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="h-4.5 w-4.5 transition-transform duration-200" />
                ) : (
                  <Eye className="h-4.5 w-4.5 transition-transform duration-200" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-xs text-destructive bg-destructive/5 p-3.5 rounded-xl border border-destructive/15 animate-in fade-in slide-in-from-top-1 duration-200">
              {error}
            </div>
          )}
        </div>

        <div className="flex flex-col space-y-4">
          <Button
            type="submit"
            className="w-full h-11 rounded-xl font-semibold shadow-md shadow-primary/10 hover:shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              'Sign Up'
            )}
          </Button>

          <div className="text-center text-xs text-muted-foreground pt-1">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-semibold text-primary hover:underline hover:text-primary/95 transition-all"
            >
              Sign in
            </Link>
          </div>
        </div>
      </form>
    </>
  );
}
