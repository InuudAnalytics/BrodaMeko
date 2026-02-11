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
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
    lineHeight: 26,
  },
  body: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.regular,
    lineHeight: 24,
  },
  muted: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.regular,
    lineHeight: 20,
  },
};
