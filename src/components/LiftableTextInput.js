import React, { forwardRef } from 'react';
import { TextInput } from 'react-native';

const LiftableTextInput = forwardRef((props, forwardedRef) => {
  return <TextInput ref={forwardedRef} {...props} />;
});

LiftableTextInput.displayName = 'LiftableTextInput';

export default LiftableTextInput;
