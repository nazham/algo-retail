import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../features/auth/hooks/use-auth';
import { Button } from '@repo/ui/components/ui/button';
import { Delete, Eraser } from 'lucide-react';

export default function LoginPage() {
  const [pin, setPin] = useState('');
  const { login, isLoading, error, setError } = useAuth(); // Use Hook

  // 1. Logic
  const handleLogin = useCallback(async () => {
    if (!pin) return;
    await login(pin);
    // If failed, we clear pin or handle error (hook handles error state)
    if (error) setPin('');
  }, [pin, login, error]);

  // 2. Input Logic
  const appendDigit = (digit: string) => {
    if (pin.length < 4) {
      setPin((prev) => prev + digit);
      setError('');
    }
  };

  // 3. Keyboard Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) appendDigit(e.key);
      if (e.key === 'Backspace') {
        setPin((prev) => prev.slice(0, -1));
        setError('');
      }
      if (e.key === 'Enter') handleLogin();
      if (e.key === 'Escape') setPin('');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, handleLogin]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-100">
      <div className="w-96 rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800">Algo Retail</h1>
          <p className="text-sm text-gray-500">System Locked</p>
        </div>

        {/* PIN Display */}
        <div className="mb-8">
          <div className="flex h-16 w-full items-center justify-center rounded-xl bg-gray-50 border-2 border-gray-100 transition-colors focus-within:border-blue-500">
            <span className="text-4xl font-bold tracking-[0.5em] text-gray-800">
              {pin.replace(/./g, '•')}
            </span>
          </div>
          <div className="h-6 mt-2 text-center">
            {error && (
              <span className="text-sm font-medium text-red-500 animate-pulse">{error}</span>
            )}
          </div>
        </div>

        {/* Shadcn Keypad */}
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <Button
              key={num}
              variant="outline"
              className="h-20 text-2xl font-bold hover:bg-blue-50 hover:text-blue-600 transition-all"
              onClick={() => appendDigit(num.toString())}
              disabled={isLoading}
            >
              {num}
            </Button>
          ))}

          <Button
            variant="destructive"
            className="h-20 bg-red-50 text-red-500 hover:bg-red-100 border-red-100"
            onClick={() => setPin('')}
            disabled={isLoading}
          >
            <Eraser />
          </Button>

          <Button
            variant="outline"
            className="h-20 text-2xl font-bold hover:bg-blue-50"
            onClick={() => appendDigit('0')}
            disabled={isLoading}
          >
            0
          </Button>

          <Button
            className="h-20 text-lg font-bold bg-blue-600 hover:bg-blue-700"
            onClick={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? '...' : 'GO'}
          </Button>
        </div>
      </div>
    </div>
  );
}
