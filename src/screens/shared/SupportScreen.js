import React, { useState } from 'react';
import { Alert, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';
import Svg, { Path } from 'react-native-svg';
import { AppButton, AppText, LiftableTextInput, ScreenContainer } from '../../components';
import { darkTheme, withAlpha } from '../../theme';
import { pickSingleImageFromGallery } from '../../utils';

const UploadImageGlyph = ({ color }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5v-11Z"
      stroke={color}
      strokeWidth={1.8}
    />
    <Path d="M8 15l2.7-3.2a1 1 0 0 1 1.5 0L16 16" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    <Path d="M13.5 8.5h5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    <Path d="M16 6v5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

const SupportScreen = ({ navigation }) => {
  const [description, setDescription] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [isPickingImage, setIsPickingImage] = useState(false);

  const handlePickAttachment = async () => {
    if (isPickingImage) {
      return;
    }

    setIsPickingImage(true);

    try {
      const { asset, cancelled, error } = await pickSingleImageFromGallery();

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

      setAttachment({
        uri: asset.uri,
        fileName: asset.fileName || '',
        type: asset.type || '',
      });
    } finally {
      setIsPickingImage(false);
    }
  };

  const handleSubmit = () => {
    Alert.alert('Submitted', 'Your support request has been sent.');
  };

  return (
    <ScreenContainer padded={false} style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} activeOpacity={0.85} onPress={() => navigation.goBack()}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color={darkTheme.colors.text} strokeWidth={2.2} />
          </TouchableOpacity>
          <AppText style={styles.headerTitle}>Support</AppText>
        </View>

        <AppText style={styles.label}>Description</AppText>
        <LiftableTextInput
          multiline
          value={description}
          onChangeText={setDescription}
          placeholder="Enter your description here"
          placeholderTextColor="rgba(255,255,255,0.42)"
          style={styles.descriptionInput}
          textAlignVertical="top"
        />

        <AppText style={styles.label}>Attachment</AppText>
        <View style={styles.uploadWrap}>
          {attachment?.uri ? (
            <Image source={{ uri: attachment.uri }} style={styles.uploadImage} />
          ) : (
            <View style={styles.emptyUploadState}>
              <View style={styles.uploadIconBadge}>
                <UploadImageGlyph color={darkTheme.colors.accent} />
              </View>
              <AppText style={styles.uploadTitle}>Attach screenshot</AppText>
              <AppText style={styles.uploadSubtitle}>JPG, PNG up to 5MB</AppText>
              <TouchableOpacity onPress={handlePickAttachment} activeOpacity={0.85} style={styles.addPhotosButton}>
                <AppText style={styles.addPhotosText}>{isPickingImage ? 'Opening...' : 'Add photos'}</AppText>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {attachment?.uri ? (
          <TouchableOpacity onPress={handlePickAttachment} activeOpacity={0.85} style={styles.changeAttachmentBtn}>
            <AppText style={styles.changeAttachmentText}>{isPickingImage ? 'Opening...' : 'Change photo'}</AppText>
          </TouchableOpacity>
        ) : null}

        <AppButton label="Submit" onPress={handleSubmit} style={styles.submitButton} />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 28,
  },
  header: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 24,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: darkTheme.colors.text,
    fontSize: 25,
    lineHeight: 24,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  label: {
    color: darkTheme.colors.text,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: darkTheme.typography.fontWeights.medium,
    marginBottom: 10,
  },
  descriptionInput: {
    minHeight: 126,
    borderRadius: 6,
    backgroundColor: 'rgba(152,154,190,0.55)',
    paddingHorizontal: 12,
    paddingTop: 12,
    color: darkTheme.colors.text,
    fontSize: darkTheme.typography.fontSizes.sm,
    lineHeight: 20,
    marginBottom: 16,
  },
  uploadWrap: {
    minHeight: 200,
    borderWidth: 1.2,
    borderStyle: 'dashed',
    borderColor: withAlpha(darkTheme.colors.accent, 0.6),
    borderRadius: 8,
    backgroundColor: 'rgba(152,154,190,0.7)',
    overflow: 'hidden',
  },
  emptyUploadState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  uploadImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  uploadIconBadge: {
    width: 54,
    height: 54,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  uploadTitle: {
    color: darkTheme.colors.text,
    fontSize: 27,
    lineHeight: 22,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  uploadSubtitle: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.56)',
    fontSize: darkTheme.typography.fontSizes.xs,
    lineHeight: 16,
    marginBottom: 18,
  },
  addPhotosButton: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: 12,
    minHeight: 44,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  addPhotosText: {
    color: 'rgba(25,25,46,0.9)',
    fontWeight: darkTheme.typography.fontWeights.medium,
    fontSize: 16,
  },
  changeAttachmentBtn: {
    alignSelf: 'flex-end',
    marginTop: 8,
    marginBottom: 12,
  },
  changeAttachmentText: {
    color: darkTheme.colors.accent,
    fontSize: darkTheme.typography.fontSizes.sm,
  },
  submitButton: {
    marginTop: 'auto',
    borderRadius: 14,
    minHeight: 52,
    marginHorizontal: 32,
  },
});

export default SupportScreen;
