import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import AppText from './AppText';
import { darkTheme } from '../theme';

let alertHandler = null;

const setAlertHandler = (handler) => {
  alertHandler = handler;
};

const AppAlert = {
  alert: (title, message, buttons, options) => {
    if (typeof alertHandler === 'function') {
      alertHandler(title, message, buttons, options);
    }
  },
};

const normalizeButtons = (buttons) => {
  if (!Array.isArray(buttons) || buttons.length === 0) {
    return [{ text: 'OK', style: 'default' }];
  }
  return buttons.map((button) => ({
    text: String(button?.text || 'OK'),
    onPress: typeof button?.onPress === 'function' ? button.onPress : null,
    style: button?.style || 'default',
  }));
};

export const AppAlertProvider = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [buttons, setButtons] = useState([{ text: 'OK', style: 'default' }]);
  const [cancelable, setCancelable] = useState(true);
  const [onDismiss, setOnDismiss] = useState(null);

  useEffect(() => {
    setAlertHandler((nextTitle, nextMessage, nextButtons, nextOptions) => {
      setTitle(String(nextTitle || 'Notice'));
      setMessage(String(nextMessage || ''));
      setButtons(normalizeButtons(nextButtons));
      setCancelable(nextOptions?.cancelable !== false);
      setOnDismiss(typeof nextOptions?.onDismiss === 'function' ? nextOptions.onDismiss : null);
      setVisible(true);
    });
    return () => setAlertHandler(null);
  }, []);

  const hide = useMemo(
    () => () => {
      setVisible(false);
      if (typeof onDismiss === 'function') {
        onDismiss();
      }
    },
    [onDismiss]
  );

  const handleButtonPress = (button) => {
    setVisible(false);
    if (typeof button?.onPress === 'function') {
      button.onPress();
    }
  };

  return (
    <>
      {children}
      <Modal transparent animationType="fade" visible={visible} onRequestClose={hide}>
        <Pressable
          style={styles.overlay}
          onPress={() => {
            if (cancelable) {
              hide();
            }
          }}
        >
          <Pressable style={styles.card}>
            <AppText style={styles.title}>{title}</AppText>
            {message ? <AppText style={styles.message}>{message}</AppText> : null}
            <View style={styles.buttonsRow}>
              {buttons.map((button, index) => {
                const isDestructive = button.style === 'destructive';
                const isCancel = button.style === 'cancel';
                return (
                  <TouchableOpacity
                    key={`${button.text}-${index}`}
                    style={[
                      styles.button,
                      isCancel && styles.cancelButton,
                      isDestructive && styles.destructiveButton,
                    ]}
                    activeOpacity={0.85}
                    onPress={() => handleButtonPress(button)}
                  >
                    <AppText
                      style={[
                        styles.buttonText,
                        isCancel && styles.cancelButtonText,
                        isDestructive && styles.destructiveButtonText,
                      ]}
                    >
                      {button.text}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    borderRadius: 16,
    backgroundColor: '#0B0A3F',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  message: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    lineHeight: 20,
  },
  buttonsRow: {
    marginTop: 14,
    flexDirection: 'row',
    columnGap: 10,
  },
  button: {
    flex: 1,
    minHeight: 42,
    borderRadius: 10,
    backgroundColor: darkTheme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  destructiveButton: {
    backgroundColor: '#B91C1C',
  },
  buttonText: {
    color: '#121212',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  cancelButtonText: {
    color: '#FFFFFF',
  },
  destructiveButtonText: {
    color: '#FFFFFF',
  },
});

export default AppAlert;
