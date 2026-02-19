import React, { forwardRef, useCallback, useState } from 'react';
import { Animated, TextInput } from 'react-native';
import useKeyboardLift from '../utils/useKeyboardLift';

const LiftableTextInput = forwardRef((props, forwardedRef) => {
  const { onFocus, onBlur, ...rest } = props;
  const [isFocused, setIsFocused] = useState(false);
  const { targetRef, animatedStyle } = useKeyboardLift({
    enabled: isFocused,
    extraOffset: 16,
    anchor: 'center',
  });

  const handleRef = useCallback(
    (node) => {
      targetRef.current = node;

      if (typeof forwardedRef === 'function') {
        forwardedRef(node);
      } else if (forwardedRef) {
        forwardedRef.current = node;
      }
    },
    [forwardedRef, targetRef]
  );

  return (
    <Animated.View style={animatedStyle}>
      <TextInput
        ref={handleRef}
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
        {...rest}
      />
    </Animated.View>
  );
});

LiftableTextInput.displayName = 'LiftableTextInput';

export default LiftableTextInput;
