import colors from './colors';
import radius from './radius';
import spacing from './spacing';
import { fontFamily, fontSizes, fontWeights, textVariants } from './typography';

export const withAlpha = (hex, alpha) => {
  const cleaned = String(hex || '').replace('#', '').trim();
  if (cleaned.length !== 6) {
    return `rgba(0,0,0,${alpha})`;
  }
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

export const darkTheme = {
  colors: colors.dark,
  spacing,
  radius,
  typography: {
    fontFamily,
    fontSizes,
    fontWeights,
    textVariants,
  },
};

export { colors, spacing, radius, fontFamily, fontSizes, fontWeights, textVariants };
