import { useEffect, useRef } from 'react';

export const useBarcodeScanner = (onScan: (code: string) => void) => {
  const buffer = useRef<string>('');
  const lastKeyTime = useRef<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now();
      const char = e.key;

      // 1. Time Check: Scanners type FAST (<50ms per key).
      // If it's slow, it's a human manually searching. Reset buffer.
      if (now - lastKeyTime.current > 100) {
        buffer.current = '';
      }
      lastKeyTime.current = now;

      // 2. Handle "Enter" (Scanner sends this at the end)
      if (char === 'Enter') {
        if (buffer.current.length > 2) {
          // Ignore accidental "Enter" hits
          onScan(buffer.current);
          buffer.current = '';
        }
        return;
      }

      // 3. Accumulate characters (Numbers/Letters only)
      if (char.length === 1) {
        buffer.current += char;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onScan]);
};
