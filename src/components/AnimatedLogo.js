import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';
import { darkTheme } from '../theme';

// RN CLI setup note:
// - Dependency: npm i react-native-svg
// - iOS only: cd ios && pod install && cd ..

const AnimatedLogo = ({ size = 92, innerScale = 0.42, duration = 1400, spinning = true, style }) => {
  const outerRotate = useRef(new Animated.Value(0)).current;
  const innerRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!spinning) {
      outerRotate.stopAnimation();
      innerRotate.stopAnimation();
      outerRotate.setValue(0);
      innerRotate.setValue(0);
      return;
    }

    outerRotate.setValue(0);
    innerRotate.setValue(0);

    const loop = Animated.loop(
      Animated.parallel([
        Animated.timing(outerRotate, {
          toValue: 1,
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(innerRotate, {
          toValue: 1,
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();

    return () => {
      loop.stop();
    };
  }, [duration, innerRotate, outerRotate, spinning]);

  const outerSpin = outerRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-360deg'],
  });

  const innerSpin = innerRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const innerSize = Math.round(size * innerScale);

  const nonagonPoints = useMemo(() => {
    const center = size / 2;
    const radius = size / 2;
    const startAngleDeg = -90;

    const points = Array.from({ length: 9 }, (_, i) => {
      const angleDeg = startAngleDeg + i * 40;
      const angleRad = (angleDeg * Math.PI) / 180;
      const x = center + radius * Math.cos(angleRad);
      const y = center + radius * Math.sin(angleRad);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    });

    return points.join(' ');
  }, [size]);

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Animated.View style={[styles.layer, { transform: [{ rotate: outerSpin }] }]}> 
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Polygon points={nonagonPoints} fill={darkTheme.colors.text} />
        </Svg>
      </Animated.View>

      <Animated.View
        style={[
          styles.inner,
          {
            width: innerSize,
            height: innerSize,
            borderRadius: Math.round(innerSize * 0.2),
            backgroundColor: darkTheme.colors.accent,
            transform: [{ rotate: innerSpin }],
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  layer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    position: 'absolute',
  },
});

export default AnimatedLogo;


