/// <reference types="vite/client" />

import type { AppApi } from '../electron/preload';

interface Window {
  api: AppApi;
}
