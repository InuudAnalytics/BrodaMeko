import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowDown01Icon } from '@hugeicons/core-free-icons';
import { darkTheme } from '../theme';

const FloatingScrollDownButton = ({ onPress, style }) => {
  return (
    <TouchableOpacity
      style={[styles.fab, style]}
      activeOpacity={0.9}
      onPress={onPress}
    >
      <HugeiconsIcon icon={ArrowDown01Icon} size={18} color="#1A1A1A" strokeWidth={2.4} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: darkTheme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 40,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 8,
  },
});

export default FloatingScrollDownButton;
