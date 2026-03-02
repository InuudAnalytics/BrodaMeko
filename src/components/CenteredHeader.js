import React, { useCallback } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';
import AppText from './AppText';
import { darkTheme } from '../theme';

const CenteredHeader = ({ title, onBackPress, backTo, backParams, style }) => {
  const navigation = useNavigation();

  const handleBackPress = useCallback(() => {
    if (onBackPress) {
      onBackPress();
      return;
    }
    if (backTo) {
      navigation.navigate(backTo, backParams);
      return;
    }
    navigation.goBack();
  }, [backParams, backTo, navigation, onBackPress]);

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={handleBackPress}
        activeOpacity={0.85}
      >
        <HugeiconsIcon
          icon={ArrowLeft01Icon}
          size={20}
          color="#FFFFFF"
          strokeWidth={2.2}
        />
      </TouchableOpacity>
      <AppText style={styles.title} numberOfLines={1}>
        {title}
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  title: {
    flex: 1,
    marginRight: 40,
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
});

export default CenteredHeader;
