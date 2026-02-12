import React from 'react';
import { StyleSheet, View } from 'react-native';
import { darkTheme } from '../theme';
import { sanitizeNigerianPhoneDigits } from '../utils';
import AppInput from './AppInput';
import AppText from './AppText';

const NigerianPhoneInput = ({
  label = 'Phone number',
  value,
  onChangeText,
  placeholder = '8012345678',
  containerStyle,
  ...rest
}) => {
  return (
    <AppInput
      label={label}
      value={value}
      onChangeText={(text) => onChangeText?.(sanitizeNigerianPhoneDigits(text))}
      placeholder={placeholder}
      keyboardType="number-pad"
      maxLength={10}
      containerStyle={containerStyle}
      left={
        <View style={styles.prefixWrap}>
          <AppText style={styles.prefixText}>+234</AppText>
        </View>
      }
      {...rest}
    />
  );
};

const styles = StyleSheet.create({
  prefixWrap: {
    paddingRight: darkTheme.spacing.xs,
    borderRightWidth: 1,
    borderRightColor: darkTheme.colors.inputBorder,
    marginRight: darkTheme.spacing.sm,
  },
  prefixText: {
    color: darkTheme.colors.text,
    fontSize: darkTheme.typography.fontSizes.sm,
  },
});

export default NigerianPhoneInput;

