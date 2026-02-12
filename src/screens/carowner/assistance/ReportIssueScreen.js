import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { AppButton, AppInput, AppText, ScreenContainer } from '../../../components';
import { darkTheme } from '../../../theme';
import { ROUTES } from '../../../utils';

const ISSUES = [
  'Flat tires',
  'Battery problem',
  'Brake failure',
  'Engine overheating',
  'Oil leak',
  'Electrical fault',
];

const IssueCard = ({ label, selected, onPress }) => {
  return (
    <Pressable onPress={onPress} style={[styles.issueCard, selected ? styles.issueCardSelected : null]}>
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

const UploadBox = ({ images, onAddPress }) => {
  return (
    <View style={styles.uploadWrap}>
      <View style={styles.uploadIconBadge}>
        <UploadImageGlyph color={darkTheme.colors.accent} />
      </View>

      <AppText variant="muted" style={styles.uploadTitle}>
        Upload Image
      </AppText>

      <TouchableOpacity onPress={onAddPress} activeOpacity={0.85} style={styles.addPhotosButton}>
        <AppText style={styles.addPhotosText}>Add photos</AppText>
      </TouchableOpacity>

      {images.length ? (
        <AppText variant="muted" style={styles.uploadCount}>
          {images.length} photo{images.length > 1 ? 's' : ''} selected
        </AppText>
      ) : null}
    </View>
  );
};

const ReportIssueScreen = ({ navigation }) => {
  const [selectedIssue, setSelectedIssue] = useState('');
  const [description, setDescription] = useState('');
  const [carMake, setCarMake] = useState('');
  const [images, setImages] = useState([]);
  const [error, setError] = useState('');

  const issuePayload = useMemo(
    () => ({ selectedIssue, description: description.trim(), carMake: carMake.trim(), images }),
    [selectedIssue, description, carMake, images],
  );

  const handleAddPhotos = () => {
    setImages((prev) => [...prev, { id: `img-${Date.now()}` }]);
    Alert.alert('Upload', 'Image picker will be connected here.');
  };

  const handleFindMechanics = () => {
    if (!selectedIssue) {
      setError('Please select at least one issue.');
      return;
    }

    setError('');
    navigation.navigate(ROUTES.CAR_OWNER_MECHANIC_DISCOVERY, { report: issuePayload });
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
              key={issue}
              label={issue}
              selected={selectedIssue === issue}
              onPress={() => {
                setSelectedIssue(issue);
                if (error) {
                  setError('');
                }
              }}
            />
          ))}
        </View>

        {error ? <AppText style={styles.errorText}>{error}</AppText> : null}

        <AppInput
          label="Description (optional)"
          placeholder="Describe your problem here"
          value={description}
          onChangeText={setDescription}
          multiline
          textAlignVertical="top"
          inputStyle={styles.descriptionInput}
        />

        <AppInput
          label="Car make"
          placeholder="Toyota Corolla"
          value={carMake}
          onChangeText={setCarMake}
          autoCapitalize="words"
        />

        <UploadBox images={images} onAddPress={handleAddPhotos} />

        <AppButton label="Find mechanics" onPress={handleFindMechanics} style={styles.cta} />
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
  },
  issueCardSelected: {
    borderColor: darkTheme.colors.accent,
    backgroundColor: 'rgba(226,255,49,0.14)',
  },
  issueText: {
    color: darkTheme.colors.text,
    textAlign: 'center',
    fontSize: darkTheme.typography.fontSizes.sm,
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
  uploadWrap: {
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
    borderRadius: darkTheme.radius.lg,
    alignItems: 'center',
    paddingVertical: darkTheme.spacing.lg,
    marginBottom: darkTheme.spacing.lg,
  },
  uploadIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(226,255,49,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: darkTheme.spacing.xs,
  },
  uploadTitle: {
    color: darkTheme.colors.text,
    marginBottom: darkTheme.spacing.xs,
  },
  addPhotosButton: {
    borderWidth: 1,
    borderColor: darkTheme.colors.accent,
    borderRadius: darkTheme.radius.md,
    paddingHorizontal: darkTheme.spacing.md,
    paddingVertical: darkTheme.spacing.xs,
  },
  addPhotosText: {
    color: darkTheme.colors.accent,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  uploadCount: {
    marginTop: darkTheme.spacing.xs,
    color: darkTheme.colors.muted,
  },
  cta: {
    marginTop: darkTheme.spacing.sm,
  },
});

export default ReportIssueScreen;
