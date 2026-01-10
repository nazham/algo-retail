import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // 1. Define Login Logic
  const handleLogin = useCallback(async () => {
    if (!pin) return;
    try {
      setError('');
      const user = await window.api.login(pin);
      // Save user to session storage (or a Global Auth Context)
      sessionStorage.setItem('algo_user', JSON.stringify(user));
      navigate('/'); // Go to POS
    } catch (err) {
      console.error(err);
      setError('Invalid PIN');
      setPin('');
    }
  }, [pin, navigate]);

  // 2. Define Input Logic
  const appendDigit = (digit: string) => {
    if (pin.length < 4) {
      setPin((prev) => prev + digit);
      setError('');
    }
  };

  // 3. The Keyboard Listener (NEW)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow numbers 0-9
      if (/^[0-9]$/.test(e.key)) {
        appendDigit(e.key);
      }
      // Handle Backspace
      else if (e.key === 'Backspace') {
        setPin((prev) => prev.slice(0, -1));
        setError('');
      }
      // Handle Enter
      else if (e.key === 'Enter') {
        handleLogin();
      }
      // Handle Escape (Clear)
      else if (e.key === 'Escape') {
        setPin('');
        setError('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Cleanup listener on unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [pin, handleLogin]); // Dependencies ensure state is fresh

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-100">
      <div className="w-96 rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800">Algo Retail</h1>
          <p className="text-sm text-gray-500">System Locked</p>
        </div>

        {/* PIN Display */}
        <div className="mb-8">
          <div className="flex h-16 w-full items-center justify-center rounded-xl bg-gray-50 border-2 border-gray-100">
            <span className="text-4xl font-bold tracking-[0.5em] text-gray-800">
              {pin.replace(/./g, '•')}
            </span>
          </div>
          {error && <p className="mt-2 text-center text-sm font-medium text-red-500">{error}</p>}
        </div>

        {/* Keypad Visuals (Still clickable) */}
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => appendDigit(num.toString())}
              className="flex h-20 w-full items-center justify-center rounded-xl bg-gray-50 text-2xl font-bold text-gray-700 transition-all hover:bg-blue-50 active:scale-95"
            >
              {num}
            </button>
          ))}

          <button
            onClick={() => setPin('')}
            className="flex h-20 w-full items-center justify-center rounded-xl bg-red-50 text-lg font-bold text-red-500 transition-all hover:bg-red-100 active:scale-95"
          >
            CLR
          </button>

          <button
            onClick={() => appendDigit('0')}
            className="flex h-20 w-full items-center justify-center rounded-xl bg-gray-50 text-2xl font-bold text-gray-700 transition-all hover:bg-blue-50 active:scale-95"
          >
            0
          </button>

          <button
            onClick={handleLogin}
            className="flex h-20 w-full items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white transition-all hover:bg-blue-700 active:scale-95"
          >
            GO
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">Use Numpad or On-Screen Keys</p>
      </div>
    </div>
  );
}
