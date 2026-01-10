/// <reference types="vite/client" />

import type { AppApi } from '../electron/preload';

interface Window {
  api: {
    login: (pin: string) => Promise<{ id: string; name: string; role: string }>;
  };
}
