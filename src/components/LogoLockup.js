import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';
import { darkTheme } from '../theme';
import AppText from './AppText';

const LogoLockup = ({ style, markSize = 86, stacked = true }) => {
  const innerSize = Math.round(markSize * 0.44);
  const wordmarkSize = Math.max(12, Math.round(markSize / 3));
  const wordmarkLineHeight = Math.round(wordmarkSize * 1.15);

  const nonagonPoints = useMemo(() => {
    const center = markSize / 2;
    const radius = markSize / 2;
    const startAngleDeg = -90;

    const points = Array.from({ length: 9 }, (_, i) => {
      const angleDeg = startAngleDeg + i * 40;
      const angleRad = (angleDeg * Math.PI) / 180;
      const x = center + radius * Math.cos(angleRad);
      const y = center + radius * Math.sin(angleRad);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    });

    return points.join(' ');
  }, [markSize]);

  return (
    <View style={[stacked ? styles.stack : styles.row, style]}>
      <View style={[styles.markWrap, { width: markSize, height: markSize }]}> 
        <Svg width={markSize} height={markSize} viewBox={`0 0 ${markSize} ${markSize}`}>
          <Polygon points={nonagonPoints} fill={darkTheme.colors.text} />
        </Svg>
        <View
          style={[
            styles.innerMark,
            {
              width: innerSize,
              height: innerSize,
              borderRadius: Math.round(innerSize * 0.2),
            },
          ]}
        />
      </View>

      <AppText
        variant="subtitle"
        style={[
          styles.wordmark,
          {
            fontSize: wordmarkSize,
            lineHeight: wordmarkLineHeight,
          },
        ]}
      >
        Broda
        <AppText
          variant="subtitle"
          color={darkTheme.colors.accent}
          style={[
            styles.wordmarkAccent,
            {
              fontSize: wordmarkSize,
              lineHeight: wordmarkLineHeight,
            },
          ]}
        >
          Meko
        </AppText>
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  stack: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: darkTheme.spacing.sm,
  },
  markWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Math.round(darkTheme.spacing.md * 0.67),
  },
  innerMark: {
    position: 'absolute',
    backgroundColor: darkTheme.colors.accent,
  },
  wordmark: {
    color: darkTheme.colors.text,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  wordmarkAccent: {
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
});

export default LogoLockup;



