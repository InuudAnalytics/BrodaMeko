import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { MinusSignIcon, PlusSignIcon } from '@hugeicons/core-free-icons';
import { AppButton, AppText, LiftableTextInput, ScreenContainer } from '../../../components';
import { useJobs } from '../../../context';
import { darkTheme, withAlpha } from '../../../theme';
import { pickSingleImageFromGallery } from '../../../utils';

const toImageItem = (image) => {
  if (!image) {
    return null;
  }

  if (typeof image === 'string') {
    return {
      uri: image,
      existingPath: image,
      isExisting: true,
    };
  }

  const uri = String(image?.url || image?.uri || image?.path || '').trim();
  if (!uri) {
    return null;
  }

  return {
    uri,
    existingPath: String(image?.path || image?.url || '').trim() || uri,
    isExisting: true,
  };
};

const EditJobScreen = ({ navigation, route }) => {
  const jobId = String(route?.params?.jobId || '').trim();
  const seedJob = route?.params?.job || {};
  const { updateJob, loading } = useJobs();

  const [carMake, setCarMake] = useState(String(seedJob?.car_make || '').trim());
  const [description, setDescription] = useState(String(seedJob?.description || '').trim());
  const [images, setImages] = useState(
    (Array.isArray(seedJob?.images) ? seedJob.images : [])
      .map(toImageItem)
      .filter(Boolean)
      .slice(0, 2)
  );
  const [removedImages, setRemovedImages] = useState([]);
  const [error, setError] = useState('');

  const canAddMore = useMemo(() => images.length < 2, [images.length]);

  const handleAddImage = async () => {
    if (!canAddMore) {
      return;
    }

    const { asset, cancelled, error: pickerError } = await pickSingleImageFromGallery();

    if (cancelled) {
      return;
    }

    if (pickerError) {
      setError(pickerError);
      return;
    }

    if (!asset?.uri) {
      return;
    }

    setImages((prev) => [
      ...prev,
      {
        uri: asset.uri,
        fileName: asset.fileName,
        type: asset.type,
        isExisting: false,
      },
    ].slice(0, 2));
  };

  const handleRemoveImage = (index) => {
    const target = images[index];
    if (!target) {
      return;
    }

    setImages((prev) => prev.filter((_, itemIndex) => itemIndex !== index));

    if (target.isExisting && target.existingPath) {
      setRemovedImages((prev) => [...prev, target.existingPath]);
    }
  };

  const handleSubmit = async () => {
    if (!jobId) {
      setError('Job ID is missing.');
      return;
    }

    if (!carMake.trim()) {
      setError('Car make is required.');
      return;
    }

    setError('');

    const newImages = images
      .filter((image) => !image.isExisting)
      .map((image) => ({
        uri: image.uri,
        fileName: image.fileName || 'job-image.jpg',
        type: image.type || 'image/jpeg',
      }));

    const payload = {
      car_make: carMake.trim(),
      description: description.trim(),
      imagesToAdd: newImages,
      remove_images: removedImages,
    };

    const response = await updateJob(jobId, payload);

    if (!response) {
      setError('Could not update this job.');
      return;
    }

    navigation.goBack();
  };

  return (
    <ScreenContainer style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.goBack()}>
            <AppText style={styles.backText}>Back</AppText>
          </TouchableOpacity>
          <AppText style={styles.title}>Edit job</AppText>
        </View>

        <AppText style={styles.label}>Car make</AppText>
        <LiftableTextInput
          value={carMake}
          onChangeText={setCarMake}
          placeholder="Toyota Camry"
          placeholderTextColor={darkTheme.colors.muted}
          style={styles.input}
        />

        <AppText style={styles.label}>Description</AppText>
        <LiftableTextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Describe your issue"
          placeholderTextColor={darkTheme.colors.muted}
          style={[styles.input, styles.textArea]}
          multiline
        />

        <View style={styles.imagesHeader}>
          <AppText style={styles.label}>Images</AppText>
          <AppText style={styles.helper}>{images.length}/2</AppText>
        </View>
        <View style={styles.imageGrid}>
          {images.map((image, index) => (
            <View key={`${image.uri}-${index}`} style={styles.imageCard}>
              <Image source={{ uri: image.uri }} style={styles.image} />
              <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemoveImage(index)} activeOpacity={0.85}>
                <HugeiconsIcon icon={MinusSignIcon} size={12} color="#1A1A1A" strokeWidth={2.2} />
              </TouchableOpacity>
            </View>
          ))}
          {canAddMore ? (
            <TouchableOpacity style={styles.addTile} activeOpacity={0.85} onPress={handleAddImage}>
              <HugeiconsIcon icon={PlusSignIcon} size={18} color={darkTheme.colors.accent} strokeWidth={2.2} />
            </TouchableOpacity>
          ) : null}
        </View>

        <AppButton
          label={loading.updateJob ? 'Saving...' : 'Save changes'}
          onPress={handleSubmit}
          disabled={loading.updateJob}
          left={loading.updateJob ? <ActivityIndicator size="small" color={darkTheme.colors.background} /> : null}
          style={styles.submitBtn}
        />

        {error ? <AppText style={styles.errorText}>{error}</AppText> : null}
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 12,
    marginBottom: 12,
  },
  backText: {
    color: darkTheme.colors.accent,
  },
  title: {
    color: darkTheme.colors.text,
    fontSize: 18,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  label: {
    marginBottom: 6,
    color: darkTheme.colors.text,
    fontSize: 13,
  },
  input: {
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
    borderRadius: 10,
    minHeight: 44,
    paddingHorizontal: 12,
    color: darkTheme.colors.text,
    marginBottom: 10,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  imagesHeader: {
    marginTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  helper: {
    color: darkTheme.colors.muted,
    fontSize: 12,
  },
  imageGrid: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 8,
    rowGap: 8,
  },
  imageCard: {
    width: 74,
    height: 74,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: darkTheme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTile: {
    width: 74,
    height: 74,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: darkTheme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(darkTheme.colors.accent, 0.08),
  },
  submitBtn: {
    marginTop: 14,
  },
  errorText: {
    marginTop: 10,
    color: '#FF7F7F',
  },
});

export default EditJobScreen;
