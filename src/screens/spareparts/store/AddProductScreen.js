import React, { useMemo, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft01Icon, CancelCircleIcon, ImageUploadIcon } from '@hugeicons/core-free-icons';
import { AppButton, AppInput, AppText, ScreenContainer } from '../../../components';
import { useSellerStore } from '../../../context/SellerStoreContext';
import { addSellerPartImages, createSellerPart } from '../../../services/spareParts.service';
import { darkTheme, withAlpha } from '../../../theme';
import { pickSingleImageFromGallery, ROUTES } from '../../../utils';
import AppAlert from '../../../components/AppAlert';
const MAX_IMAGES = 5;
const SCREEN_BG = '#000033';

const sanitizeDigits = (value) => String(value || '').replace(/\D/g, '');
const REFURBISHED_CONDITION = 'refurbished';

const AddProductScreen = ({ navigation }) => {
  const { addProduct } = useSellerStore();
  const [images, setImages] = useState([]);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [condition, setCondition] = useState('new');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [isPicking, setIsPicking] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const canPublish = useMemo(() => {
    return images.length > 0 && name.trim() && quantity.trim() && price.trim();
  }, [images.length, name, price, quantity]);

  const handleAddImage = async () => {
    if (images.length >= MAX_IMAGES) {
      AppAlert.alert('Limit reached', 'You can upload up to 5 images.');
      return;
    }

    setIsPicking(true);

    try {
      const { asset, cancelled, error } = await pickSingleImageFromGallery();

      if (cancelled) {
        return;
      }

      if (error) {
        AppAlert.alert('Upload failed', error);
        return;
      }

      if (!asset?.uri) {
        return;
      }

      setImages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${prev.length}`,
          uri: asset.uri,
          fileName: asset.fileName || '',
          type: asset.type || '',
        },
      ]);
    } finally {
      setIsPicking(false);
    }
  };

  const handleRemoveImage = (imageId) => {
    setImages((prev) => prev.filter((item) => item.id !== imageId));
  };

  const handlePublish = async () => {
    if (!canPublish || isPublishing) {
      return;
    }

    setIsPublishing(true);
    try {
      const response = await createSellerPart({
        name: name.trim(),
        description: description.trim(),
        price: Number(price || 0),
        stock_quantity: Number(quantity || 0),
        condition,
      });

      const payload = response?.data || response || {};
      const saved = payload?.part || payload?.data || payload;
      const savedId = String(saved?.id || saved?._id || '').trim();
      if (savedId && images.length) {
        await addSellerPartImages(savedId, images);
      }
      if (saved) {
        addProduct(saved);
      }

      AppAlert.alert('Product published', 'Your product is now visible in your store.');
      navigation.navigate(ROUTES.SPARE_PARTS_TABS, { tab: 'store' });
    } catch (error) {
      AppAlert.alert('Publish failed', error?.message || 'Could not publish product.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <ScreenContainer padded={false} style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboard}>
        <View style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} activeOpacity={0.85} onPress={() => navigation.goBack()}>
              <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color={darkTheme.colors.text} strokeWidth={2.2} />
            </TouchableOpacity>
            <AppText style={styles.headerTitle}>Add new product</AppText>
          </View>

          <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
            <View style={styles.imageHeader}>
              <AppText style={styles.sectionLabel}>Product images</AppText>
              <AppText variant="muted" style={styles.imageHint}>
                {images.length}/{MAX_IMAGES} selected
              </AppText>
            </View>

            <View style={styles.uploadBox}>
              <View style={styles.uploadRow}>
                <HugeiconsIcon icon={ImageUploadIcon} size={20} color={darkTheme.colors.accent} strokeWidth={2} />
                <AppText style={styles.uploadTitle}>Add product images</AppText>
              </View>
              <AppText variant="muted" style={styles.uploadSubtitle}>
                Upload up to {MAX_IMAGES} images to showcase your product.
              </AppText>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleAddImage}
                disabled={isPicking}
                style={[styles.uploadButton, isPicking ? styles.addImageCardDisabled : null]}
              >
                <AppText style={styles.uploadButtonText}>{isPicking ? 'Picking...' : 'Add image'}</AppText>
              </TouchableOpacity>
            </View>

            {images.length ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageRow}>
                {images.map((image) => (
                  <View key={image.id} style={styles.thumbnail}>
                    <Image source={{ uri: image.uri }} style={styles.thumbnailImage} />
                    <TouchableOpacity
                      style={styles.removeThumb}
                      activeOpacity={0.85}
                      onPress={() => handleRemoveImage(image.id)}
                    >
                      <HugeiconsIcon icon={CancelCircleIcon} size={16} color={darkTheme.colors.background} strokeWidth={2.2} />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            ) : null}

            <AppInput
              label="Product name"
              placeholder="e.g Toyota Camry brake pad"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />

            <AppInput
              label="Quantity"
              placeholder="e.g 16"
              value={quantity}
              onChangeText={(value) => setQuantity(sanitizeDigits(value))}
              keyboardType="number-pad"
            />

            <AppInput
              label="Price"
              placeholder="0.00"
              value={price}
              onChangeText={(value) => setPrice(sanitizeDigits(value))}
              keyboardType="number-pad"
            />

            <AppText style={styles.sectionLabel}>Condition</AppText>
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggleButton, condition === 'new' ? styles.toggleActive : null]}
                activeOpacity={0.85}
                onPress={() => setCondition('new')}
              >
                <AppText style={[styles.toggleText, condition === 'new' ? styles.toggleTextActive : null]}>New</AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, condition === REFURBISHED_CONDITION ? styles.toggleActive : null]}
                activeOpacity={0.85}
                onPress={() => setCondition(REFURBISHED_CONDITION)}
              >
                <AppText style={[styles.toggleText, condition === REFURBISHED_CONDITION ? styles.toggleTextActive : null]}>
                  Used/Refurbished
                </AppText>
              </TouchableOpacity>
            </View>

            <AppInput
              label="Pickup location"
              placeholder="Enter your shop location"
              value={location}
              onChangeText={setLocation}
              autoCapitalize="words"
            />

            <View style={styles.textAreaWrap}>
              <AppText variant="muted" style={styles.textAreaLabel}>
                Description
              </AppText>
              <View style={styles.textAreaCard}>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Enter your description"
                  placeholderTextColor={darkTheme.colors.muted}
                  multiline
                  textAlignVertical="top"
                  style={styles.textAreaInput}
                />
              </View>
            </View>

            <AppButton
              label={isPublishing ? 'Publishing...' : 'Publish product'}
              onPress={handlePublish}
              disabled={!canPublish || isPublishing}
              style={styles.publishButton}
            />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: SCREEN_BG,
  },
  keyboard: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  header: {
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
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
    fontSize: 18,
    lineHeight: 24,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  form: {
    paddingTop: 10,
    paddingBottom: 20,
  },
  imageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionLabel: {
    color: darkTheme.colors.text,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  imageHint: {
    color: darkTheme.colors.accent,
    fontSize: 12,
  },
  imageRow: {
    paddingBottom: 6,
    columnGap: 10,
    marginTop: 10,
  },
  addImageCardDisabled: {
    opacity: 0.6,
  },
  uploadBox: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: withAlpha(darkTheme.colors.accent, 0.4),
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 12,
  },
  uploadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
  },
  uploadTitle: {
    color: darkTheme.colors.text,
    fontSize: 13,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  uploadSubtitle: {
    marginTop: 6,
    fontSize: 12,
    color: darkTheme.colors.muted,
  },
  uploadButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: withAlpha(darkTheme.colors.accent, 0.15),
  },
  uploadButtonText: {
    color: darkTheme.colors.accent,
    fontSize: 12,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  thumbnail: {
    width: 92,
    height: 92,
    borderRadius: 12,
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeThumb: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: darkTheme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    columnGap: 10,
    marginBottom: 16,
    marginTop: 8,
  },
  toggleButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  toggleActive: {
    backgroundColor: darkTheme.colors.accent,
    borderColor: darkTheme.colors.accent,
  },
  toggleText: {
    color: darkTheme.colors.text,
    fontSize: 12,
  },
  toggleTextActive: {
    color: '#1A1A1A',
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  textAreaWrap: {
    marginBottom: darkTheme.spacing.md,
  },
  textAreaLabel: {
    marginBottom: 8,
    fontFamily: 'Raleway-Regular',
    fontSize: 18,
    lineHeight: 30,
    fontWeight: '400',
    color: darkTheme.colors.text,
  },
  textAreaCard: {
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
    borderRadius: 16,
    paddingHorizontal: darkTheme.spacing.md,
    paddingTop: 8,
    minHeight: 120,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  textAreaInput: {
    color: darkTheme.colors.text,
    fontFamily: 'Raleway-Light',
    fontSize: 14,
    lineHeight: 21,
    minHeight: 100,
  },
  publishButton: {
    marginTop: 6,
  },
});

export default AddProductScreen;



