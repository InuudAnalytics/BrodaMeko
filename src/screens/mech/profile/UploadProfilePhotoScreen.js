import React, { useState } from 'react';
import { Alert, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft01Icon, Camera01Icon } from '@hugeicons/core-free-icons';
import { AppButton, AppText, ScreenContainer } from '../../../components';
import { useMechanicProfile } from '../../../context';
import { darkTheme } from '../../../theme';
import { pickSingleImageFromGallery } from '../../../utils';

const UploadProfilePhotoScreen = ({ navigation }) => {
  const { mechanicProfile, setProfilePhoto } = useMechanicProfile();
  const [selectedUri, setSelectedUri] = useState(mechanicProfile.profilePhotoUri || null);
  const [loading, setLoading] = useState(false);

  const handlePickPhoto = async () => {
    setLoading(true);
    try {
      const { cancelled, asset, error } = await pickSingleImageFromGallery();

      if (cancelled) {
        return;
      }

      if (error) {
        Alert.alert('Photo upload', error);
        return;
      }

      if (asset?.uri) {
        setSelectedUri(asset.uri);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!selectedUri) {
      Alert.alert('Photo required', 'Please upload a profile photo to continue.');
      return;
    }

    setProfilePhoto(selectedUri);
    navigation.goBack();
  };

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.85} onPress={() => navigation.goBack()}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color={darkTheme.colors.text} strokeWidth={2.1} />
          </TouchableOpacity>
          <AppText style={styles.headerTitle}>Upload profile photo</AppText>
        </View>

        <View style={styles.avatarWrap}>
          {selectedUri ? (
            <Image source={{ uri: selectedUri }} style={styles.avatarImage} />
          ) : (
            <HugeiconsIcon icon={Camera01Icon} size={42} color="rgba(255,255,255,0.75)" strokeWidth={1.8} />
          )}
        </View>

        <AppText style={styles.helperText}>Use a clear photo of your face for trust and visibility.</AppText>

        <AppButton
          label={loading ? 'Opening gallery...' : 'Select photo'}
          onPress={handlePickPhoto}
          style={styles.selectBtn}
          textStyle={styles.selectBtnText}
        />
        <AppButton label="Save and continue" onPress={handleSave} style={styles.saveBtn} />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000033',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  header: {
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  backBtn: {
    position: 'absolute',
    left: 0,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: darkTheme.colors.text,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  avatarWrap: {
    marginTop: 34,
    alignSelf: 'center',
    width: 154,
    height: 154,
    borderRadius: 77,
    borderWidth: 1.5,
    borderColor: darkTheme.colors.inputBorder,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  helperText: {
    marginTop: 16,
    color: darkTheme.colors.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  selectBtn: {
    marginTop: 22,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: darkTheme.colors.accent,
  },
  selectBtnText: {
    color: darkTheme.colors.accent,
  },
  saveBtn: {
    marginTop: 12,
  },
});

export default UploadProfilePhotoScreen;
