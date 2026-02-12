import colors from './colors';
import radius from './radius';
import spacing from './spacing';
import { fontFamily, fontSizes, fontWeights, textVariants } from './typography';

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
