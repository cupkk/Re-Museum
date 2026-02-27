/**
 * REMUSE 统一日志系统
 * 生产环境自动静默，开发环境带前缀输出。
 */

// Vite injects import.meta.env at build time; cast via unknown to satisfy strict TS
const meta = import.meta as unknown as { env?: { DEV?: boolean } };
const isDev = meta.env?.DEV ?? true;

const noop = (..._args: unknown[]) => {};

const logger = {
  info:  isDev ? (...args: unknown[]) => console.log('[REMUSE]', ...args) : noop,
  warn:  isDev ? (...args: unknown[]) => console.warn('[REMUSE]', ...args) : noop,
  error: isDev ? (...args: unknown[]) => console.error('[REMUSE]', ...args) : noop,
  debug: isDev ? (...args: unknown[]) => console.debug('[REMUSE]', ...args) : noop,
};

export default logger;
