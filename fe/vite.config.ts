import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      tsconfigPaths: true,
      // rendering.md: bản build đo bằng React Profiler
      alias:
        mode === 'profiling'
          ? [{ find: 'react-dom/client', replacement: 'react-dom/profiling' }]
          : [],
    },
    build: {
      rolldownOptions: {
        output: {
          // Tách thư viện ra chunk riêng: ít thay đổi nên trình duyệt cache được lâu
          codeSplitting: {
            groups: [
              {
                name: 'react',
                test: /node_modules[\\/](react|react-dom|react-router|scheduler)[\\/]/,
                priority: 2,
              },
              { name: 'vendor', test: /node_modules[\\/]/, priority: 1 },
            ],
          },
        },
      },
    },
    server: {
      port: 5173,
      // Gọi /api/... sẽ được chuyển tới backend NestJS, không cần cấu hình CORS khi dev
      proxy: {
        '/api': {
          target: env.VITE_PROXY_TARGET || 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
  }
})
