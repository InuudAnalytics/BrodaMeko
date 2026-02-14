import React, { useContext, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  BatteryCharging02Icon,
  HelpCircleIcon,
  MinusSignIcon,
  OilBarrelIcon,
  StopCircleIcon,
  TemperatureIcon,
  TireIcon,
  ZapIcon,
} from '@hugeicons/core-free-icons';
import Svg, { Path } from 'react-native-svg';
import { AppButton, AppInput, AppText, ScreenContainer } from '../../../components';
import JobsContext from '../../../context/JobsContext';
import { darkTheme } from '../../../theme';
import { pickSingleImageFromGallery, ROUTES } from '../../../utils';

const ISSUES = [
  { label: 'Flat tires', icon: TireIcon },
  { label: 'Battery problem', icon: BatteryCharging02Icon },
  { label: 'Brake failure', icon: StopCircleIcon },
  { label: 'Engine overheating', icon: TemperatureIcon },
  { label: 'Oil leak', icon: OilBarrelIcon },
  { label: 'Electrical fault', icon: ZapIcon },
  { label: 'Other', icon: HelpCircleIcon },
];

const ISSUE_TYPE_MAP = {
  'Flat tires': 'flat_tires',
  'Battery problem': 'battery_problem',
  'Brake failure': 'brake_failure',
  'Engine overheating': 'engine_trouble',
  'Oil leak': 'engine_trouble',
  'Electrical fault': 'engine_trouble',
  Other: 'other',
};

const IssueCard = ({ label, icon, selected, onPress }) => {
  const iconColor = selected ? darkTheme.colors.accent : darkTheme.colors.text;

  return (
    <Pressable onPress={onPress} style={[styles.issueCard, selected ? styles.issueCardSelected : null]}>
      <View style={[styles.issueIconWrap, selected ? styles.issueIconWrapSelected : null]}>
        <HugeiconsIcon icon={icon} size={20} color={iconColor} strokeWidth={2} />
      </View>
      <AppText style={[styles.issueText, selected ? styles.issueTextSelected : null]}>{label}</AppText>
    </Pressable>
  );
};

const UploadImageGlyph = ({ color }) => {
  return (
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
};

const UploadBox = ({ images, onAddPress, onRemoveImage, isPickingImage, showMaxUploadError }) => {
  const maxReached = images.length >= 5;
  const hasImages = images.length > 0;

  return (
    <View style={styles.photosSection}>
      <AppText variant="muted" style={styles.photosLabel}>
        Damage photos
      </AppText>

      {hasImages ? (
        <View style={styles.uploadWrap}>
          <View style={styles.previewGrid}>
            {images.slice(0, 5).map((image) => (
              <View key={image.id} style={styles.previewTile}>
                <Image source={{ uri: image.uri }} style={styles.previewImage} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  activeOpacity={0.8}
                  onPress={() => onRemoveImage(image.id)}
                >
                  <HugeiconsIcon icon={MinusSignIcon} size={12} color={darkTheme.colors.background} strokeWidth={2.6} />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity
              onPress={onAddPress}
              activeOpacity={0.85}
              disabled={isPickingImage}
              style={[
                styles.addTile,
                maxReached || isPickingImage ? styles.addTileDisabled : null,
              ]}
            >
              <AppText style={[styles.addTileText, maxReached ? styles.addTileTextDisabled : null]}>
                {isPickingImage ? '...' : '+'}
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.uploadWrapEmpty}>
          <View style={styles.uploadIconBadge}>
            <UploadImageGlyph color={darkTheme.colors.accent} />
          </View>

          <AppText variant="muted" style={styles.uploadTitle}>
            Upload Image
          </AppText>
          <AppText variant="muted" style={styles.uploadSubtitle}>
            Add photos of the damage for better diagnosis
          </AppText>

          <TouchableOpacity onPress={onAddPress} activeOpacity={0.85} style={styles.addPhotosButton}>
            <AppText style={styles.addPhotosText}>{isPickingImage ? 'Opening...' : 'Add photos'}</AppText>
          </TouchableOpacity>
        </View>
      )}

      {showMaxUploadError ? (
        <AppText style={styles.uploadMaxText}>Maximum of 5 upload is exhausted</AppText>
      ) : null}

      {images.length ? (
        <AppText variant="muted" style={styles.uploadCount}>
          {images.length} photo{images.length > 1 ? 's' : ''} selected
        </AppText>
      ) : null}
    </View>
  );
};

const ReportIssueScreen = ({ navigation }) => {
  const jobsContext = useContext(JobsContext);
  const [selectedIssue, setSelectedIssue] = useState('');
  const [description, setDescription] = useState('');
  const [carMake, setCarMake] = useState('');
  const [images, setImages] = useState([]);
  const [error, setError] = useState('');
  const [isPickingImage, setIsPickingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMaxUploadError, setShowMaxUploadError] = useState(false);
  const isCreatingJob = Boolean(jobsContext?.loading?.createJob);

  const resolveIssueType = () => ISSUE_TYPE_MAP[selectedIssue] || 'other';

  const handleAddPhotos = async () => {
    if (images.length >= 5) {
      setShowMaxUploadError(true);
      return;
    }

    setShowMaxUploadError(false);
    setIsPickingImage(true);

    try {
      const { asset, cancelled, error: pickerError } = await pickSingleImageFromGallery();

      if (cancelled) {
        return;
      }

      if (pickerError) {
        Alert.alert('Upload failed', pickerError);
        return;
      }

      if (asset?.uri) {
        setImages((prev) =>
          [
            ...prev,
            {
              id: `${Date.now()}-${prev.length}`,
              uri: asset.uri,
              fileName: asset.fileName || '',
              type: asset.type || '',
            },
          ].slice(0, 5)
        );
      }
    } catch {
      Alert.alert('Upload failed', 'Could not open gallery. Please try again.');
    } finally {
      setIsPickingImage(false);
    }
  };

  const handleRemoveImage = (imageId) => {
    setImages((prev) => {
      const next = prev.filter((image) => image.id !== imageId);

      if (next.length < 5) {
        setShowMaxUploadError(false);
      }

      return next;
    });
  };

  const handleFindMechanics = async () => {
    if (!selectedIssue) {
      setError('Please select at least one issue.');
      return;
    }

    const issueType = resolveIssueType();

    if (issueType === 'other' && !description.trim()) {
      setError('Please describe the issue when selecting Other.');
      return;
    }

    if (!jobsContext?.createJob) {
      setError('Could not submit issue right now. Please try again.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await jobsContext.createJob({
        issue_type: issueType,
        description: description.trim(),
        car_make: carMake.trim(),
        images,
      });

      if (!response?.success) {
        setError(response?.message || 'We could not submit your request. Please try again.');
        return;
      }

      const jobPayload = response?.data?.job || response?.data || null;
      const jobId = String(
        jobPayload?.id || jobPayload?._id || jobPayload?.job_id || jobPayload?.jobId || ''
      ).trim();

      if (!jobPayload && !jobId) {
        setError('Request submitted, but we could not load job details. Please try again.');
        return;
      }

      navigation.navigate(ROUTES.CAR_OWNER_MECHANIC_DISCOVERY, {
        jobId: jobId || undefined,
        job: jobPayload || undefined,
      });
    } catch {
      setError('We could not submit your request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer padded={false} edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppText variant="subtitle" style={styles.sectionTitle}>
          Select an issue
        </AppText>

        <View style={styles.issueGrid}>
          {ISSUES.map((issue) => (
            <IssueCard
              key={issue.label}
              label={issue.label}
              icon={issue.icon}
              selected={selectedIssue === issue.label}
              onPress={() => {
                setSelectedIssue(issue.label);
                if (error) {
                  setError('');
                }
              }}
            />
          ))}
        </View>

        {error ? <AppText style={styles.errorText}>{error}</AppText> : null}

        <AppInput
          label={selectedIssue === 'Other' ? 'Description (required)' : 'Description (optional)'}
          placeholder={
            selectedIssue === 'Other'
              ? 'Please describe your issue'
              : 'Describe your problem here'
          }
          value={description}
          onChangeText={(text) => {
            setDescription(text);
            if (error) {
              setError('');
            }
          }}
          multiline
          textAlignVertical="top"
          inputStyle={styles.descriptionInput}
        />

        <AppInput
          label="Car make"
          placeholder="Toyota Corolla"
          value={carMake}
          onChangeText={(text) => {
            setCarMake(text);
            if (error) {
              setError('');
            }
          }}
          autoCapitalize="words"
        />

        <UploadBox
          images={images}
          onAddPress={handleAddPhotos}
          onRemoveImage={handleRemoveImage}
          isPickingImage={isPickingImage}
          showMaxUploadError={showMaxUploadError}
        />

        <AppButton
          label={isSubmitting || isCreatingJob ? 'Submitting...' : 'Find mechanics'}
          onPress={handleFindMechanics}
          style={styles.cta}
          disabled={isSubmitting || isCreatingJob}
        />
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: darkTheme.spacing.xl,
    paddingTop: darkTheme.spacing.lg,
    paddingBottom: darkTheme.spacing.xxl,
  },
  sectionTitle: {
    color: darkTheme.colors.text,
    marginBottom: darkTheme.spacing.sm,
  },
  issueGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: darkTheme.spacing.sm,
    marginBottom: darkTheme.spacing.md,
  },
  issueCard: {
    minWidth: '47%',
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
    borderRadius: darkTheme.radius.md,
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingVertical: darkTheme.spacing.md,
    paddingHorizontal: darkTheme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 112,
    rowGap: darkTheme.spacing.xs,
  },
  issueCardSelected: {
    borderColor: darkTheme.colors.accent,
    backgroundColor: 'rgba(226,255,49,0.14)',
  },
  issueIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  issueIconWrapSelected: {
    backgroundColor: 'rgba(226,255,49,0.22)',
  },
  issueText: {
    color: darkTheme.colors.text,
    textAlign: 'center',
    fontSize: darkTheme.typography.fontSizes.sm,
    lineHeight: 18,
  },
  issueTextSelected: {
    color: darkTheme.colors.accent,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  errorText: {
    color: '#FF7B8A',
    fontSize: darkTheme.typography.fontSizes.xs,
    lineHeight: 16,
    marginBottom: darkTheme.spacing.md,
  },
  descriptionInput: {
    minHeight: 112,
    paddingTop: darkTheme.spacing.sm,
  },
  photosSection: {
    marginBottom: darkTheme.spacing.lg,
  },
  photosLabel: {
    color: darkTheme.colors.text,
    marginBottom: darkTheme.spacing.xs,
  },
  uploadWrap: {
    borderWidth: 1.2,
    borderStyle: 'dashed',
    borderColor: 'rgba(226,255,49,0.45)',
    borderRadius: darkTheme.radius.lg,
    backgroundColor: 'rgba(152,154,190,0.7)',
    paddingHorizontal: darkTheme.spacing.sm,
    paddingVertical: darkTheme.spacing.sm,
  },
  uploadWrapEmpty: {
    borderWidth: 1.2,
    borderStyle: 'dashed',
    borderColor: 'rgba(226,255,49,0.45)',
    borderRadius: darkTheme.radius.lg,
    backgroundColor: 'rgba(152,154,190,0.7)',
    alignItems: 'center',
    paddingVertical: darkTheme.spacing.lg,
    paddingHorizontal: darkTheme.spacing.md,
  },
  uploadIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: darkTheme.spacing.xs,
  },
  uploadTitle: {
    color: darkTheme.colors.text,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  uploadSubtitle: {
    marginTop: 2,
    color: 'rgba(255,255,255,0.7)',
    fontSize: darkTheme.typography.fontSizes.xs,
    textAlign: 'center',
    marginBottom: darkTheme.spacing.sm,
  },
  addPhotosButton: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: darkTheme.radius.md,
    paddingHorizontal: darkTheme.spacing.lg,
    paddingVertical: darkTheme.spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  addPhotosText: {
    color: 'rgba(25,25,46,0.85)',
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  uploadCount: {
    marginTop: darkTheme.spacing.xs,
    color: darkTheme.colors.muted,
    fontSize: darkTheme.typography.fontSizes.xs,
  },
  previewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: darkTheme.spacing.xs,
  },
  previewTile: {
    flexBasis: '31%',
    maxWidth: '31%',
    height: 74,
    flexShrink: 0,
    borderRadius: darkTheme.radius.sm,
    overflow: 'hidden',
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(226,255,49,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  addTile: {
    flexBasis: '31%',
    maxWidth: '31%',
    height: 74,
    flexShrink: 0,
    borderRadius: darkTheme.radius.sm,
    borderWidth: 1,
    borderColor: darkTheme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  addTileDisabled: {
    borderColor: 'rgba(255,255,255,0.22)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  addTileText: {
    color: darkTheme.colors.accent,
    fontSize: 28,
    lineHeight: 28,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  addTileTextDisabled: {
    color: 'rgba(255,255,255,0.45)',
  },
  uploadMaxText: {
    marginTop: darkTheme.spacing.xs,
    color: '#FF4B6E',
    fontSize: darkTheme.typography.fontSizes.xs,
    lineHeight: 16,
  },
  cta: {
    marginTop: darkTheme.spacing.sm,
  },
});

export default ReportIssueScreen;
