import Config from 'react-native-config';

const sanitizeEnvValue = (value) => {
  const raw = String(value || '').trim();
  if (!raw) {
    return '';
  }

  // Accept both KEY=value and KEY='value' styles from local .env files.
  if (
    (raw.startsWith("'") && raw.endsWith("'")) ||
    (raw.startsWith('"') && raw.endsWith('"'))
  ) {
    return raw.slice(1, -1).trim();
  }

  return raw;
};

export const GOOGLE_MAPS_API_KEY = sanitizeEnvValue(Config.GOOGLE_MAPS_API_KEY);
