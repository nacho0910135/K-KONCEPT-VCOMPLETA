module.exports = async () => {
  const { defineConfig } = await import('vite');
  const react = (await import('@vitejs/plugin-react')).default;

  return defineConfig({
    plugins: [react()],
    server: {
      port: 5173,
      strictPort: false,
      proxy: {
        '/api': 'http://localhost:4000'
      }
    },
    build: {
      outDir: 'dist-web'
    }
  });
};
