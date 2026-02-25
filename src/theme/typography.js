import { Platform } from 'react-native';

export const headerFontFamily = Platform.select({
  ios: 'SF Pro Rounded',
  default: 'VarelaRound-Regular',
});

export const bodyFontFamily = 'Raleway-Regular';
export const fontFamily = bodyFontFamily;

export const fontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 28,
  xxl: 34,
};

export const fontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

export const textVariants = {
  title: {
    fontFamily: headerFontFamily,
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    lineHeight: 34,
  },
  subtitle: {
    fontFamily: headerFontFamily,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
    lineHeight: 26,
  },
  body: {
    fontFamily: bodyFontFamily,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.regular,
    lineHeight: 24,
  },
  muted: {
    fontFamily: bodyFontFamily,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.regular,
    lineHeight: 20,
  },
};
