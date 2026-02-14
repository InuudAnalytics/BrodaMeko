import { launchImageLibrary } from 'react-native-image-picker';

const DEFAULT_PICKER_OPTIONS = {
  mediaType: 'photo',
  selectionLimit: 1,
  quality: 0.85,
};

export const pickSingleImageFromGallery = async (options = {}) => {
  const response = await launchImageLibrary({
    ...DEFAULT_PICKER_OPTIONS,
    ...options,
  });

  if (response.didCancel) {
    return { cancelled: true, asset: null, error: null };
  }

  if (response.errorCode) {
    return {
      cancelled: false,
      asset: null,
      error: response.errorMessage || 'Could not select image. Please try again.',
    };
  }

  const asset = response.assets?.[0] || null;

  if (!asset?.uri) {
    return { cancelled: false, asset: null, error: 'No image selected. Please try again.' };
  }

  return { cancelled: false, asset, error: null };
};
