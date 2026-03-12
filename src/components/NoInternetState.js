import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import AppText from './AppText';

const TINT = 'rgba(186, 194, 210, 0.46)';

const NoInternetIcon = ({ size = 112, color = TINT }) => {
  const strokeWidth = Math.max(2, Math.round(size * 0.03));
  const center = size / 2;

  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      <Circle cx={center} cy={center} r={center - 6} fill="rgba(255,255,255,0.03)" stroke={color} strokeWidth={1.2} />
      <Path d="M30 70c16-16 44-16 60 0" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" fill="none" />
      <Path d="M42 82c10-10 26-10 36 0" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" fill="none" />
      <Path d="M55 93c3-3 7-3 10 0" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" fill="none" />
      <Path d="M24 24l72 72" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
};

const NoInternetState = ({
  title = 'Network error',
  message = 'Please check your connection and try again.',
  onRetry,
  retryLabel = 'Reload',
  style,
}) => {
  return (
    <View style={[styles.wrap, style]}>
      <NoInternetIcon />
      <AppText style={styles.title}>{title}</AppText>
      <AppText style={styles.message}>{message}</AppText>
      {typeof onRetry === 'function' ? (
        <TouchableOpacity style={styles.retryBtn} activeOpacity={0.85} onPress={onRetry}>
          <AppText style={styles.retryText}>{retryLabel}</AppText>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  title: {
    marginTop: 12,
    color: TINT,
    fontSize: 18,
    lineHeight: 24,
    textAlign: 'center',
  },
  message: {
    marginTop: 8,
    color: TINT,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 320,
  },
  retryBtn: {
    marginTop: 14,
    minHeight: 34,
    minWidth: 100,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(230, 199, 20, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(230, 199, 20, 0.08)',
  },
  retryText: {
    color: '#E6C714',
    fontSize: 12,
    lineHeight: 16,
  },
});

export default NoInternetState;
