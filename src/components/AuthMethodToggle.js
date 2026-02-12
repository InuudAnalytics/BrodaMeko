import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, TouchableOpacity, View } from 'react-native';
import { darkTheme } from '../theme';
import AppText from './AppText';

const defaultOptions = [
  { label: 'Phone Number', value: 'phone' },
  { label: 'Email Address', value: 'email' },
];

const AuthMethodToggle = ({ options = defaultOptions, initialValue = 'phone', onChange, style }) => {
  const [selectedValue, setSelectedValue] = useState(initialValue);
  const [containerWidth, setContainerWidth] = useState(0);
  const slideX = useRef(new Animated.Value(0)).current;
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    setSelectedValue(initialValue);
  }, [initialValue]);

  const activeIndex = useMemo(() => {
    const index = options.findIndex((option) => option.value === selectedValue);
    return index >= 0 ? index : 0;
  }, [options, selectedValue]);

  const optionWidth = containerWidth > 0 ? containerWidth / Math.max(1, options.length) : 0;

  useEffect(() => {
    if (!optionWidth) {
      return;
    }

    Animated.timing(slideX, {
      toValue: activeIndex * optionWidth,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [activeIndex, optionWidth, slideX]);

  useEffect(() => {
    if (onChangeRef.current) {
      onChangeRef.current(selectedValue);
    }
  }, [selectedValue]);

  return (
    <View
      style={[styles.wrap, style]}
      onLayout={(event) => setContainerWidth(event.nativeEvent.layout.width)}
    >
      {optionWidth ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.activePill,
            {
              width: optionWidth - 4,
              transform: [{ translateX: slideX }],
            },
          ]}
        />
      ) : null}

      {options.map((option) => {
        const isActive = option.value === selectedValue;

        return (
          <TouchableOpacity
            key={option.value}
            activeOpacity={0.9}
            onPress={() => setSelectedValue(option.value)}
            style={styles.option}
          >
            <AppText style={[styles.label, isActive ? styles.labelActive : styles.labelInactive]}>
              {option.label}
            </AppText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    minHeight: 48,
    borderRadius: darkTheme.radius.lg,
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: darkTheme.spacing.md,
    overflow: 'hidden',
    position: 'relative',
  },
  activePill: {
    position: 'absolute',
    top: 2,
    left: 2,
    bottom: 2,
    borderRadius: darkTheme.radius.md,
    backgroundColor: darkTheme.colors.accent,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  label: {
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  labelActive: {
    color: darkTheme.colors.background,
  },
  labelInactive: {
    color: darkTheme.colors.text,
  },
});

export default AuthMethodToggle;
