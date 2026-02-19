import React from 'react';
import { Animated, StyleSheet, TextInput, View } from 'react-native';
import { darkTheme } from '../theme';
import useKeyboardLift from '../utils/useKeyboardLift';
import AppText from './AppText';

const radius = darkTheme.radius || { md: 12, lg: 16, xl: 20 };

const AppInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize = 'none',
  autoCorrect = false,
  containerStyle,
  inputStyle,
  labelStyle,
  left,
  right,
  onFocus,
  onBlur,
  ...rest
}) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const { targetRef, animatedStyle } = useKeyboardLift({
    enabled: isFocused,
    extraOffset: 16,
    anchor: 'center',
  });

  return (
    <Animated.View style={[styles.container, containerStyle, animatedStyle]}>
      {label ? <AppText variant="muted" style={[styles.label, labelStyle]}>{label}</AppText> : null}

      <View style={styles.inputWrap}>
        {left ? <View style={styles.left}>{left}</View> : null}
        <TextInput
          ref={targetRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={darkTheme.colors.muted}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          onFocus={(event) => {
            setIsFocused(true);
            if (typeof onFocus === 'function') {
              onFocus(event);
            }
          }}
          onBlur={(event) => {
            setIsFocused(false);
            if (typeof onBlur === 'function') {
              onBlur(event);
            }
          }}
          style={[styles.input, inputStyle]}
          {...rest}
        />
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: darkTheme.spacing.md,
  },
  label: {
    marginBottom: darkTheme.spacing.xs,
  },
  inputWrap: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
    borderRadius: radius.lg,
    paddingHorizontal: darkTheme.spacing.md,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    color: darkTheme.colors.text,
    fontSize: darkTheme.typography.fontSizes.md,
    paddingVertical: darkTheme.spacing.sm,
  },
  left: {
    marginRight: darkTheme.spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  right: {
    marginLeft: darkTheme.spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AppInput;
