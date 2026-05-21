module.exports = async () => {
  const { defineConfig } = await import('vite');
  const react = (await import('@vitejs/plugin-react')).default;

  return defineConfig({
    plugins: [react()],
    server: {
      port: 5173,
      strictPort: false
    },
    build: {
      outDir: 'dist-web'
    }
  });
};
