import React, { useContext, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  ArrowLeft01Icon,
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

const ISSUE_GROUPS = [
  {
    key: 'tyres_wheels',
    label: 'Tyres & Wheels',
    icon: TireIcon,
    issues: [
      { label: 'Flat tyres', value: 'flat_tyres' },
      { label: 'Tyre burst', value: 'tyre_burst' },
      { label: 'Wheel alignment issue', value: 'wheel_alignment_issue' },
    ],
  },
  {
    key: 'battery_starting',
    label: 'Battery & Starting',
    icon: BatteryCharging02Icon,
    issues: [
      { label: 'Battery problem', value: 'battery_problem' },
      { label: 'Dead battery', value: 'dead_battery' },
      { label: 'Alternator failure', value: 'alternator_failure' },
      { label: 'Starter motor fault', value: 'starter_motor_fault' },
    ],
  },
  {
    key: 'engine',
    label: 'Engine Issues',
    icon: TemperatureIcon,
    issues: [
      { label: 'Engine overheating', value: 'engine_overheating' },
      { label: 'Engine knocking', value: 'engine_knocking' },
      { label: 'Engine misfire', value: 'engine_misfire' },
      { label: 'Engine stalling', value: 'engine_stalling' },
    ],
  },
  {
    key: 'braking',
    label: 'Braking System',
    icon: StopCircleIcon,
    issues: [
      { label: 'Brake failure', value: 'brake_failure' },
      { label: 'Brake pad worn', value: 'brake_pad_worn' },
      { label: 'Brake fluid leak', value: 'brake_fluid_leak' },
      { label: 'ABS fault', value: 'abs_fault' },
    ],
  },
  {
    key: 'electrical',
    label: 'Electrical',
    icon: ZapIcon,
    issues: [
      { label: 'Electrical fault', value: 'electrical_fault' },
      { label: 'Headlight issue', value: 'headlight_issue' },
      { label: 'Dashboard warning light', value: 'dashboard_warning_light' },
      { label: 'Wiring problem', value: 'wiring_problem' },
      { label: 'Fuse problem', value: 'fuse_problem' },
    ],
  },
  {
    key: 'fluids',
    label: 'Fluids & Leakage',
    icon: OilBarrelIcon,
    issues: [
      { label: 'Oil leak', value: 'oil_leak' },
      { label: 'Coolant leak', value: 'coolant_leak' },
      { label: 'Fuel leak', value: 'fuel_leak' },
      { label: 'Power steering leak', value: 'power_steering_leak' },
    ],
  },
  {
    key: 'steering',
    label: 'Steering & Suspension',
    icon: HelpCircleIcon,
    issues: [
      { label: 'Steering problem', value: 'steering_problem' },
      { label: 'Suspension noise', value: 'suspension_noise' },
      { label: 'Shock absorber issue', value: 'shock_absorber_issue' },
    ],
  },
  {
    key: 'fuel',
    label: 'Fuel System',
    icon: HelpCircleIcon,
    issues: [
      { label: 'Fuel pump failure', value: 'fuel_pump_failure' },
      { label: 'Injector problem', value: 'injector_problem' },
      { label: 'Car not accelerating', value: 'car_not_accelerating' },
    ],
  },
  {
    key: 'ac_comfort',
    label: 'AC & Comfort',
    icon: TemperatureIcon,
    issues: [
      { label: 'AC not cooling', value: 'ac_not_cooling' },
    ],
  },
  {
    key: 'transmission',
    label: 'Transmission',
    icon: HelpCircleIcon,
    issues: [
      { label: 'Gear not shifting', value: 'gear_not_shifting' },
      { label: 'Clutch problem', value: 'clutch_problem' },
      { label: 'Transmission leak', value: 'transmission_leak' },
    ],
  },
  {
    key: 'lock_key',
    label: 'Lock & Key',
    icon: HelpCircleIcon,
    issues: [
      { label: 'Key locked inside', value: 'key_locked_inside' },
      { label: 'Ignition problem', value: 'ignition_problem' },
    ],
  },
  {
    key: 'emergency',
    label: 'Emergency / Misc',
    icon: HelpCircleIcon,
    issues: [
      { label: 'Car accident damage', value: 'car_accident_damage' },
      { label: 'Towing needed', value: 'towing_needed' },
      { label: 'General inspection', value: 'general_inspection' },
      { label: 'Other', value: 'other' },
    ],
  },
];

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

const UploadBox = ({ images, onAddPress, onRemoveImage, isPickingImage }) => {
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
              disabled={maxReached || isPickingImage}
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

      {maxReached ? (
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
  const [activeGroupKey, setActiveGroupKey] = useState(ISSUE_GROUPS[0].key);
  const [selectedIssueType, setSelectedIssueType] = useState('');
  const [description, setDescription] = useState('');
  const [carMake, setCarMake] = useState('');
  const [images, setImages] = useState([]);
  const [errors, setErrors] = useState({
    issue: '',
    description: '',
    carMake: '',
    submit: '',
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [isPickingImage, setIsPickingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isCreatingJob = Boolean(jobsContext?.loading?.createJob);

  const activeGroup = useMemo(
    () => ISSUE_GROUPS.find((group) => group.key === activeGroupKey) || ISSUE_GROUPS[0],
    [activeGroupKey]
  );
  const selectedIssueLabel = useMemo(() => {
    for (let groupIndex = 0; groupIndex < ISSUE_GROUPS.length; groupIndex += 1) {
      const group = ISSUE_GROUPS[groupIndex];
      const match = group.issues.find((issue) => issue.value === selectedIssueType);
      if (match) {
        return match.label;
      }
    }
    return '';
  }, [selectedIssueType]);

  const resolveCreatedJobPayload = (response) => {
    const root = response || {};
    const candidates = [
      root?.job,
      root?.data?.job,
      root?.data?.data?.job,
      root?.data?.data,
      root?.data,
      root,
    ];

    for (let index = 0; index < candidates.length; index += 1) {
      const candidate = candidates[index];
      if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
        continue;
      }

      const possibleId = String(
        candidate?.id || candidate?._id || candidate?.job_id || candidate?.jobId || ''
      ).trim();

      if (possibleId) {
        return candidate;
      }
    }

    return null;
  };

  const handleAddPhotos = async () => {
    if (images.length >= 5) {
      return;
    }
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
    setImages((prev) => prev.filter((image) => image.id !== imageId));
  };

  const handleFindMechanics = async () => {
    setErrors({ issue: '', description: '', carMake: '', submit: '' });
    setSuccessMessage('');

    if (!selectedIssueType) {
      setErrors((prev) => ({ ...prev, issue: 'Please select at least one issue.' }));
      return;
    }

    if (selectedIssueType === 'other' && !description.trim()) {
      setErrors((prev) => ({ ...prev, description: 'Please describe the issue when selecting Other.' }));
      return;
    }

    if (!carMake.trim()) {
      setErrors((prev) => ({ ...prev, carMake: 'Please enter your car make.' }));
      return;
    }

    if (!jobsContext?.createJob) {
      setErrors((prev) => ({ ...prev, submit: 'Could not submit issue right now. Please try again.' }));
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await jobsContext.createJob({
        issue_type: selectedIssueType,
        description: description.trim(),
        car_make: carMake.trim(),
        images,
      });

      const responseJob = resolveCreatedJobPayload(response);
      const inferredJobId = String(
        responseJob?.id || responseJob?._id || responseJob?.job_id || responseJob?.jobId || ''
      ).trim();
      const isSuccessResponse =
        response?.success === true ||
        Boolean(inferredJobId) ||
        /created successfully/i.test(String(response?.message || ''));

      if (!isSuccessResponse) {
        setErrors((prev) => ({
          ...prev,
          submit: response?.message || 'We could not submit your request. Please try again.',
        }));
        return;
      }

      setSuccessMessage('Job created successfully');

      const jobPayload = responseJob;
      const jobId = String(
        jobPayload?.id || jobPayload?._id || jobPayload?.job_id || jobPayload?.jobId || ''
      ).trim();
      if (!jobId) {
        setErrors((prev) => ({
          ...prev,
          submit: 'Job was created but no job ID was returned. Please try again.',
        }));
        return;
      }

      navigation.navigate(ROUTES.CAR_OWNER_MECHANIC_DISCOVERY, {
        jobId,
        job: jobPayload || undefined,
      });
    } catch {
      setErrors((prev) => ({ ...prev, submit: 'We could not submit your request. Please try again.' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} keyboardAware={false}>
      <KeyboardAvoidingView style={styles.keyboardWrap} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} activeOpacity={0.85} onPress={() => navigation.goBack()}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color={darkTheme.colors.text} strokeWidth={2.1} />
          </TouchableOpacity>
          <AppText style={styles.headerTitle}>What is the issue</AppText>
        </View>

        <AppText variant="subtitle" style={styles.sectionTitle}>
          Select an issue
        </AppText>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.groupTabsRow}>
          {ISSUE_GROUPS.map((group) => (
            <TouchableOpacity
              key={group.key}
              activeOpacity={0.85}
              style={[styles.groupTab, activeGroupKey === group.key ? styles.groupTabActive : null]}
              onPress={() => setActiveGroupKey(group.key)}
            >
              <AppText style={[styles.groupTabText, activeGroupKey === group.key ? styles.groupTabTextActive : null]}>
                {group.label}
              </AppText>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.issueGrid}>
          {activeGroup.issues.map((issue) => (
            <IssueCard
              key={issue.value}
              label={issue.label}
              icon={activeGroup.icon}
              selected={selectedIssueType === issue.value}
              onPress={() => {
                setSelectedIssueType(issue.value);
                setErrors((prev) => ({ ...prev, issue: '', submit: '' }));
              }}
            />
          ))}
        </View>

        {errors.issue ? <AppText style={styles.errorText}>{errors.issue}</AppText> : null}

        <View>
          <AppInput
            label={selectedIssueType === 'other' ? 'Description (required)' : 'Description (optional)'}
            placeholder={
              selectedIssueType === 'other'
                ? 'Please describe your issue'
                : selectedIssueLabel
                  ? `Describe your ${selectedIssueLabel.toLowerCase()} issue`
                  : 'Describe your problem here'
            }
            value={description}
            onChangeText={(text) => {
              setDescription(text);
              setErrors((prev) => ({ ...prev, description: '', submit: '' }));
            }}
            multiline
            textAlignVertical="top"
            inputStyle={styles.descriptionInput}
          />
        </View>
        {errors.description ? <AppText style={styles.errorText}>{errors.description}</AppText> : null}

        <View>
          <AppInput
            label="Car make"
            placeholder="Toyota Corolla"
            value={carMake}
            onChangeText={(text) => {
              setCarMake(text);
              setErrors((prev) => ({ ...prev, carMake: '', submit: '' }));
            }}
            autoCapitalize="words"
          />
        </View>
        {errors.carMake ? <AppText style={styles.errorText}>{errors.carMake}</AppText> : null}

        <UploadBox
          images={images}
          onAddPress={handleAddPhotos}
          onRemoveImage={handleRemoveImage}
          isPickingImage={isPickingImage}
        />

        <AppButton
          label={isSubmitting || isCreatingJob ? 'Submitting...' : 'Find mechanics'}
          onPress={handleFindMechanics}
          style={styles.cta}
          disabled={isSubmitting || isCreatingJob}
          left={
            isSubmitting || isCreatingJob ? (
              <ActivityIndicator size="small" color="#000033" />
            ) : null
          }
        />

        {errors.submit ? <AppText style={styles.errorText}>{errors.submit}</AppText> : null}
        {successMessage ? <AppText style={styles.successText}>{successMessage}</AppText> : null}
      </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  keyboardWrap: {
    flex: 1,
  },
  content: {
    paddingHorizontal: darkTheme.spacing.xl,
    paddingTop: darkTheme.spacing.sm,
    paddingBottom: darkTheme.spacing.xxl,
  },
  header: {
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: darkTheme.spacing.md,
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
  groupTabsRow: {
    paddingBottom: darkTheme.spacing.sm,
    columnGap: darkTheme.spacing.xs,
  },
  groupTab: {
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  groupTabActive: {
    borderColor: darkTheme.colors.accent,
    backgroundColor: 'rgba(226,255,49,0.16)',
  },
  groupTabText: {
    color: darkTheme.colors.text,
    fontSize: darkTheme.typography.fontSizes.xs,
    lineHeight: 16,
  },
  groupTabTextActive: {
    color: darkTheme.colors.accent,
    fontWeight: darkTheme.typography.fontWeights.semibold,
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
  successText: {
    color: '#22C55E',
    fontSize: darkTheme.typography.fontSizes.xs,
    lineHeight: 16,
    marginTop: darkTheme.spacing.xs,
    marginBottom: darkTheme.spacing.sm,
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
