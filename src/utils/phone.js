export const NIGERIA_COUNTRY_CODE = '+234';

export const getNigerianLocalDigits = (value = '') => {
  const raw = String(value).replace(/\D/g, '');

  if (raw.startsWith('234')) {
    return raw.slice(3, 13);
  }

  if (raw.startsWith('0')) {
    return raw.slice(1, 11);
  }

  return raw.slice(0, 10);
};

export const sanitizeNigerianPhoneDigits = (value = '') => {
  return getNigerianLocalDigits(value).replace(/\D/g, '').slice(0, 10);
};

export const isValidNigerianPhoneDigits = (value = '') => {
  return sanitizeNigerianPhoneDigits(value).length === 10;
};

export const withNigerianCountryCode = (value = '') => {
  const local = sanitizeNigerianPhoneDigits(value);
  return local ? `${NIGERIA_COUNTRY_CODE}${local}` : '';
};

export const maskNigerianPhone = (value = '') => {
  const local = sanitizeNigerianPhoneDigits(value);

  if (!local) {
    return '';
  }

  if (local.length <= 6) {
    return `${NIGERIA_COUNTRY_CODE}${local}`;
  }

  return `${NIGERIA_COUNTRY_CODE}${local.slice(0, 3)}****${local.slice(-3)}`;
};
