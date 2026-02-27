// ============================================================
// Re-Museum 生产服务器
// 功能：1) 托管 Vite 构建的静态文件  2) 反向代理 Gemini API
// 运行：node server.mjs
// ============================================================

import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';
import compression from 'compression';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_BASE_URL = process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com';

if (!GEMINI_API_KEY) {
  console.error('❌ 缺少环境变量 GEMINI_API_KEY，请在 .env 中配置');
  process.exit(1);
}

const app = express();

// gzip 压缩
app.use(compression());

// ============================
// Gemini API 反向代理
// ============================
app.use(
  '/api/gemini',
  createProxyMiddleware({
    target: GEMINI_BASE_URL,
    changeOrigin: true,
    pathRewrite: { '^/api/gemini': '' },
    on: {
      proxyReq: (proxyReq) => {
        // 注入真实 API Key
        const url = new URL(proxyReq.path || '/', 'http://localhost');
        url.searchParams.delete('key');
        url.searchParams.set('key', GEMINI_API_KEY);
        proxyReq.path = url.pathname + url.search;
        proxyReq.setHeader('x-goog-api-key', GEMINI_API_KEY);
      },
    },
  })
);

// ============================
// 静态文件托管（Vite 构建产物）
// ============================
app.use(express.static(path.join(__dirname, 'dist'), {
  maxAge: '7d',           // 静态资源缓存 7 天（文件名含 hash）
  immutable: true,
}));

// SPA 回退：所有未匹配的路由返回 index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🏛️  Re-Museum 服务已启动: http://0.0.0.0:${PORT}`);
  console.log(`   Gemini 代理上游: ${GEMINI_BASE_URL}`);
});
