import React, { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Add01Icon, ArrowLeft01Icon, Delete02Icon } from '@hugeicons/core-free-icons';
import { AppButton, AppText, ScreenContainer } from '../../../components';
import { useMechanicProfile } from '../../../context';
import { darkTheme } from '../../../theme';
import { pickSingleImageFromGallery } from '../../../utils';

const ImagePickerRow = ({ title, images, onAdd, onRemove }) => {
  return (
    <View style={styles.section}>
      <AppText style={styles.sectionTitle}>{title}</AppText>
      <View style={styles.imageGrid}>
        {images.map((uri, index) => (
          <View key={`${title}-${uri}-${index}`} style={styles.imageTile}>
            <Image source={{ uri }} style={styles.image} />
            <TouchableOpacity style={styles.removeBtn} activeOpacity={0.85} onPress={() => onRemove(index)}>
              <HugeiconsIcon icon={Delete02Icon} size={12} color={darkTheme.colors.background} strokeWidth={2.4} />
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={styles.addTile} activeOpacity={0.85} onPress={onAdd}>
          <HugeiconsIcon icon={Add01Icon} size={18} color={darkTheme.colors.accent} strokeWidth={2.1} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const KycUploadScreen = ({ navigation }) => {
  const { mechanicProfile, setKyc } = useMechanicProfile();
  const [ninImages, setNinImages] = useState(mechanicProfile.ninImages || []);
  const [passportImages, setPassportImages] = useState(mechanicProfile.passportImages || []);
  const [loadingKey, setLoadingKey] = useState('');

  const addImage = async (target) => {
    setLoadingKey(target);

    try {
      const { cancelled, asset, error } = await pickSingleImageFromGallery();

      if (cancelled) {
        return;
      }

      if (error) {
        Alert.alert('Upload failed', error);
        return;
      }

      if (!asset?.uri) {
        return;
      }

      if (target === 'nin') {
        setNinImages((prev) => [...prev, asset.uri]);
      } else {
        setPassportImages((prev) => [...prev, asset.uri]);
      }
    } finally {
      setLoadingKey('');
    }
  };

  const removeImage = (target, index) => {
    if (target === 'nin') {
      setNinImages((prev) => prev.filter((_, idx) => idx !== index));
      return;
    }
    setPassportImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSave = () => {
    if (!ninImages.length || !passportImages.length) {
      Alert.alert('KYC required', 'Please upload at least one NIN and one Passport image.');
      return;
    }

    setKyc({ ninImages, passportImages });
    navigation.goBack();
  };

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.85} onPress={() => navigation.goBack()}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color={darkTheme.colors.text} strokeWidth={2.1} />
          </TouchableOpacity>
          <AppText style={styles.headerTitle}>Upload ID verification</AppText>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <AppText style={styles.helper}>Upload clear images for your NIN and Passport documents.</AppText>

          <ImagePickerRow
            title={loadingKey === 'nin' ? 'NIN images (opening...)' : 'NIN images'}
            images={ninImages}
            onAdd={() => addImage('nin')}
            onRemove={(index) => removeImage('nin', index)}
          />

          <ImagePickerRow
            title={loadingKey === 'passport' ? 'Passport images (opening...)' : 'Passport images'}
            images={passportImages}
            onAdd={() => addImage('passport')}
            onRemove={(index) => removeImage('passport', index)}
          />
        </ScrollView>

        <View style={styles.footer}>
          <AppButton label="Save and continue" onPress={handleSave} />
        </View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000033',
  },
  container: {
    flex: 1,
  },
  header: {
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    paddingHorizontal: 16,
    marginTop: 8,
  },
  backBtn: {
    position: 'absolute',
    left: 16,
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
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  helper: {
    color: darkTheme.colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    color: darkTheme.colors.text,
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 8,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  imageTile: {
    width: 92,
    height: 92,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  addTile: {
    width: 92,
    height: 92,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: darkTheme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  removeBtn: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: darkTheme.colors.accent,
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 10,
  },
});

export default KycUploadScreen;
