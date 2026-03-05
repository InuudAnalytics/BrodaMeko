const logger = {
  log: (...args) => console.log('[BrodaMeko]', ...args),
  warn: (...args) => console.warn('[BrodaMeko]', ...args),
  error: (...args) => console.error('[BrodaMeko]', ...args),
};

export default logger;
