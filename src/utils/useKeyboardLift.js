import { useEffect, useRef } from 'react';
import { Animated, Dimensions, Keyboard, Platform } from 'react-native';

const useKeyboardLift = ({ extraOffset = 8, enabled = true, anchor = 'center' } = {}) => {
  const targetRef = useRef(null);
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = (event) => {
      const keyboardHeight = event?.endCoordinates?.height || 0;
      const keyboardTop = Dimensions.get('window').height - keyboardHeight;

      requestAnimationFrame(() => {
        if (!targetRef.current?.measureInWindow) {
          return;
        }

        targetRef.current.measureInWindow((x, y, width, height) => {
          const shift = (() => {
            if (anchor === 'bottom') {
              const targetBottomY = y + height;
              return Math.max(0, targetBottomY - keyboardTop + extraOffset);
            }

            const targetCenterY = y + height / 2;
            const visibleCenterY = keyboardTop / 2;
            return Math.max(0, targetCenterY - visibleCenterY + extraOffset);
          })();

          Animated.timing(translateY, {
            toValue: -shift,
            duration: 220,
            useNativeDriver: true,
          }).start();
        });
      });
    };

    const onHide = () => {
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start();
    };

    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [anchor, enabled, extraOffset, translateY]);

  return {
    targetRef,
    animatedStyle: { transform: [{ translateY }] },
  };
};

export default useKeyboardLift;
