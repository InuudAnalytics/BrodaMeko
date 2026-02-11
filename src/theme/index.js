import colors from './colors';
import radius from './radius';
import spacing from './spacing';
import { fontSizes, fontWeights, textVariants } from './typography';

export const darkTheme = {
  colors: colors.dark,
  spacing,
  radius,
  typography: {
    fontSizes,
    fontWeights,
    textVariants,
  },
};

export { colors, spacing, radius, fontSizes, fontWeights, textVariants };
