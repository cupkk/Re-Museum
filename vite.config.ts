import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const geminiApiKey = env.GEMINI_API_KEY || '';
    // Upstream: Chinese relay station or Google default
    const geminiUpstream = env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com';

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          // ====================================================
          // Gemini API 反向代理 — API Key 仅存在于服务端内存
          // 客户端发送 /api/gemini/... → 代理注入真实 Key → 转发至上游
          // ====================================================
          '/api/gemini': {
            target: geminiUpstream,
            changeOrigin: true,
            rewrite: (reqPath) => reqPath.replace(/^\/api\/gemini/, ''),
            configure: (proxy) => {
              proxy.on('proxyReq', (proxyReq) => {
                // 将客户端的占位 key 替换为真实 API Key
                const reqUrl = new URL(proxyReq.path || '/', 'http://localhost');
                reqUrl.searchParams.delete('key');
                reqUrl.searchParams.set('key', geminiApiKey);
                proxyReq.path = reqUrl.pathname + reqUrl.search;
                proxyReq.setHeader('x-goog-api-key', geminiApiKey);
              });
            },
          },
        },
      },
      plugins: [react()],
      define: {
        // ⚠️ API Key 不再注入客户端包！只暴露代理端点 URL（safe to expose）
        // 开发环境：默认 /api/gemini → Vite 代理
        // 生产环境：设置 GEMINI_PROXY_URL 指向你部署的后端代理
        'process.env.GEMINI_PROXY_URL': JSON.stringify(env.GEMINI_PROXY_URL || '/api/gemini'),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
