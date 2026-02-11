const logger = {
  log: (...args) => console.log('[BrotherMeko]', ...args),
  warn: (...args) => console.warn('[BrotherMeko]', ...args),
  error: (...args) => console.error('[BrotherMeko]', ...args),
};

export default logger;
