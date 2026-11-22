import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  if (mode === 'app') {
    const { VITE_API_URL } = loadEnv(mode, process.cwd());
    let apiUrl: URL | undefined;
    try {
      apiUrl = new URL(VITE_API_URL);
    } catch {
      // Report the same configuration error for missing and malformed URLs.
    }
    if (apiUrl?.protocol !== 'https:' || apiUrl.username || apiUrl.password || apiUrl.search || apiUrl.hash) {
      throw new Error('Packaged builds require an absolute HTTPS VITE_API_URL without credentials, a query, or a fragment.');
    }
  }

  return { plugins: [react(), tailwindcss()] };
});
