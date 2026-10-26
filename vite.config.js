module.exports = async () => {
  const { defineConfig, loadEnv } = await import('vite');
  const react = (await import('@vitejs/plugin-react')).default;
  const { VITE_API_URL } = loadEnv('production', process.cwd(), 'VITE_');
  const apiOrigin = VITE_API_URL ? new URL(VITE_API_URL, 'https://www.kollabkoncepts.me').origin : '';

  return defineConfig({
    plugins: [react()],
    server: {
      port: 5173,
      strictPort: false,
      proxy: {
        '/api': 'http://localhost:4000'
      }
    },
    preview: {
      headers: {
        'Content-Security-Policy': `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: blob: https:; media-src 'self' blob: https://res.cloudinary.com; connect-src 'self' ${apiOrigin}; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'; upgrade-insecure-requests`,
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Strict-Transport-Security': 'max-age=31536000'
      },
      allowedHosts: [
        'kollab-frontend-production.up.railway.app',
        'kollabkoncepts.me',
        'www.kollabkoncepts.me'
      ]
    },
    build: {
      outDir: 'dist-web'
    }
  });
};
