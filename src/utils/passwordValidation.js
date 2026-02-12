export const hasMinPasswordLength = (value, minLength = 8) => {
  return String(value || '').length >= minLength;
};

export const hasNumberOrSpecialCharacter = (value) => {
  const password = String(value || '');
  return /\d|[^A-Za-z0-9]/.test(password);
};

export const validatePasswordRules = (value) => {
  return {
    minLength: hasMinPasswordLength(value, 8),
    hasNumberOrSpecialCharacter: hasNumberOrSpecialCharacter(value),
  };
};
