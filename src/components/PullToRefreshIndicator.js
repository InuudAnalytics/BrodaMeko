import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { darkTheme } from '../theme';

const PullToRefreshIndicator = ({ pullDistance, refreshing }) => {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!refreshing) {
      spin.stopAnimation();
      spin.setValue(0);
      return;
    }

    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
    );

    loop.start();

    return () => loop.stop();
  }, [refreshing, spin]);

  const clampedPull = pullDistance.interpolate({
    inputRange: [0, 120],
    outputRange: [0, 120],
    extrapolate: 'clamp',
  });

  const opacity = pullDistance.interpolate({
    inputRange: [0, 20, 80],
    outputRange: [0, 0.6, 1],
    extrapolate: 'clamp',
  });

  const translateY = pullDistance.interpolate({
    inputRange: [0, 120],
    outputRange: [-30, 16],
    extrapolate: 'clamp',
  });

  const pullRotate = clampedPull.interpolate({
    inputRange: [0, 120],
    outputRange: ['0deg', '220deg'],
  });

  const spinRotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <Animated.View
        style={[
          styles.wheel,
          {
            transform: [{ rotate: refreshing ? spinRotate : pullRotate }],
          },
        ]}
      >
        <View style={styles.inner} />
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  wheel: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 3,
    borderColor: darkTheme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: darkTheme.colors.background,
  },
  inner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: darkTheme.colors.accent,
  },
});

export default PullToRefreshIndicator;
