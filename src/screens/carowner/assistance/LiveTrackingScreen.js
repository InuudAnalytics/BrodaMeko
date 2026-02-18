import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Car02Icon, CallIcon, GearsIcon, Location01Icon, Mail01Icon, Tick04Icon } from '@hugeicons/core-free-icons';
import Svg, { Path } from 'react-native-svg';
import { AppButton, AppText, ScreenContainer } from '../../../components';
import { confirmJob } from '../../../services/jobs.service';
import { darkTheme } from '../../../theme';
import { ROUTES } from '../../../utils';

const STATUS_STEPS = ['Accepted', 'En Route', 'Arrived', 'Repairing', 'Done'];
const EN_ROUTE_INDEX = 1;

const StarIcon = ({ color }) => {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8L3.5 9.7l5.9-.9L12 3.5Z"
        fill={color}
      />
    </Svg>
  );
};

const STEP_ICONS = {
  Accepted: Tick04Icon,
  'En Route': Car02Icon,
  Arrived: Location01Icon,
  Repairing: GearsIcon,
  Done: Tick04Icon,
};

const StatusStepper = ({ currentIndex }) => {
  const progressPercent = (currentIndex / (STATUS_STEPS.length - 1)) * 100;

  return (
    <View style={styles.stepperWrap}>
      <View style={styles.stepTrack}>
        <View style={[styles.stepTrackFill, { width: `${progressPercent}%` }]} />
      </View>
      {STATUS_STEPS.map((label, index) => {
        const isActive = index <= currentIndex;
        const isCurrent = index === currentIndex;
        const iconColor = isActive ? darkTheme.colors.background : '#C4C8D7';
        return (
          <View key={label} style={styles.stepItem}>
            <View style={styles.stepCircleWrap}>
              <View style={[styles.stepDot, isActive ? styles.stepDotActive : null, isCurrent ? styles.stepDotCurrent : null]} />
              <View style={styles.stepIconWrap}>
                <HugeiconsIcon icon={STEP_ICONS[label]} size={14} color={iconColor} strokeWidth={2.1} />
              </View>
            </View>
            <AppText style={[styles.stepLabel, isActive ? styles.stepLabelActive : null]}>{label}</AppText>
          </View>
        );
      })}
    </View>
  );
};

const MechanicCard = ({ mechanic, onCallPress, onMessagePress }) => {
  return (
    <View style={styles.mechanicCard}>
      <View style={styles.mechanicRow}>
        <View style={styles.avatar}>
          <AppText style={styles.avatarText}>{mechanic.initials || 'M'}</AppText>
        </View>

        <View style={styles.mechanicInfo}>
          <AppText style={styles.mechanicName}>{mechanic.name}</AppText>
          <View style={styles.addressRatingRow}>
            <AppText variant="muted" style={styles.mechanicAddress}>
              14 Ahmadu Bello way, Ilorin
            </AppText>
            <View style={styles.ratingRow}>
              <StarIcon color={darkTheme.colors.accent} />
              <AppText style={styles.ratingText}>{mechanic.rating || '4.8'}</AppText>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.actionRow}>
        <AppButton
          label="Call"
          onPress={onCallPress}
          style={styles.callBtn}
          left={<HugeiconsIcon icon={CallIcon} size={18} color={darkTheme.colors.background} strokeWidth={2} />}
        />
        <TouchableOpacity style={styles.messageBtn} activeOpacity={0.88} onPress={onMessagePress}>
          <HugeiconsIcon icon={Mail01Icon} size={18} color={darkTheme.colors.accent} strokeWidth={2} />
          <AppText style={styles.messageBtnText}>Message</AppText>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const LiveTrackingScreen = ({ navigation, route }) => {
  const mechanic = route?.params?.mechanic || {
    name: 'Samuel Olamilekan',
    initials: 'SO',
    rating: '4.8',
  };

  const [currentStep, setCurrentStep] = useState(EN_ROUTE_INDEX);
  const [confirmingCompletion, setConfirmingCompletion] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= STATUS_STEPS.length - 1) {
          return prev;
        }
        return prev + 1;
      });
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  const isDone = currentStep === STATUS_STEPS.length - 1;
  const distanceText = useMemo(() => (isDone ? 'has completed your request' : 'is 1.2 miles away and driving towards you'), [isDone]);

  const handleConfirmCompletion = async () => {
    const jobId = String(route?.params?.jobId || '').trim();

    if (!jobId) {
      Alert.alert('Unable to confirm', 'Job reference is missing.');
      return;
    }

    setConfirmingCompletion(true);
    try {
      await confirmJob(jobId);
      Alert.alert('Success', 'Job completion confirmed.');
      navigation.navigate(ROUTES.CAR_OWNER_HISTORY);
    } catch (confirmError) {
      Alert.alert('Error', confirmError?.message || 'Could not confirm completion.');
    } finally {
      setConfirmingCompletion(false);
    }
  };

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <View style={styles.mapArea}>
        <View style={styles.mapRoadA} />
        <View style={styles.mapRoadB} />
        <View style={styles.mapRoadC} />
        <View style={styles.routeLine} />
        <View style={styles.routePin} />
      </View>

      <View style={styles.sheet}>
        <AppText style={styles.sheetTitle}>En Route</AppText>
        <AppText variant="muted" style={styles.sheetSubtitle}>
          {mechanic.name} {distanceText}
        </AppText>

        <StatusStepper currentIndex={currentStep} />

        <MechanicCard
          mechanic={mechanic}
          onCallPress={() => Alert.alert('Call', `Calling ${mechanic.name}`)}
          onMessagePress={() =>
            navigation.navigate(ROUTES.CAR_OWNER_CHAT, {
              mechanic,
              jobId: route?.params?.jobId,
              mechanicId: route?.params?.mechanic?.id || route?.params?.mechanicId || mechanic?.id,
            })
          }
        />

        <Pressable style={styles.nextBtn} onPress={() => setCurrentStep((s) => Math.min(s + 1, STATUS_STEPS.length - 1))}>
          <AppText style={styles.nextBtnText}>Advance status</AppText>
        </Pressable>

        {isDone ? (
          <View style={styles.doneWrap}>
            <AppText style={styles.doneText}>Job completed</AppText>
            <TouchableOpacity
              style={[styles.rateBtn, confirmingCompletion ? styles.rateBtnDisabled : null]}
              activeOpacity={0.88}
              onPress={handleConfirmCompletion}
              disabled={confirmingCompletion}
            >
              <AppText style={styles.rateBtnText}>{confirmingCompletion ? 'Confirming...' : 'Confirm completion'}</AppText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.rateBtn}
              activeOpacity={0.88}
              onPress={() =>
                navigation.navigate(ROUTES.CAR_OWNER_RATE_MECHANIC, {
                  mechanicId: route?.params?.mechanic?.id || route?.params?.mechanicId || null,
                  jobId: route?.params?.jobId || null,
                })
              }
            >
              <AppText style={styles.rateBtnText}>Rate mechanic</AppText>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
  },
  mapArea: {
    flex: 1,
    backgroundColor: '#2B2B31',
    overflow: 'hidden',
  },
  mapRoadA: {
    position: 'absolute',
    top: 60,
    left: -40,
    width: 380,
    height: 6,
    backgroundColor: '#57575E',
    transform: [{ rotate: '-25deg' }],
  },
  mapRoadB: {
    position: 'absolute',
    top: 170,
    left: 10,
    width: 420,
    height: 6,
    backgroundColor: '#515158',
    transform: [{ rotate: '8deg' }],
  },
  mapRoadC: {
    position: 'absolute',
    top: 260,
    left: -30,
    width: 360,
    height: 6,
    backgroundColor: '#505057',
    transform: [{ rotate: '-12deg' }],
  },
  routeLine: {
    position: 'absolute',
    top: 140,
    left: 60,
    width: 14,
    height: 170,
    borderRadius: 7,
    backgroundColor: '#2FAEFC',
  },
  routePin: {
    position: 'absolute',
    top: 122,
    left: 50,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FF2D2D',
    borderWidth: 4,
    borderColor: '#2B2B31',
  },
  sheet: {
    backgroundColor: darkTheme.colors.background,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    marginTop: -18,
    paddingHorizontal: darkTheme.spacing.lg,
    paddingTop: darkTheme.spacing.lg,
    paddingBottom: darkTheme.spacing.xl,
  },
  sheetTitle: {
    color: darkTheme.colors.text,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  sheetSubtitle: {
    marginTop: darkTheme.spacing.xs,
    color: darkTheme.colors.muted,
    lineHeight: 20,
  },
  stepperWrap: {
    marginTop: darkTheme.spacing.md,
    marginBottom: darkTheme.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'relative',
  },
  stepTrack: {
    position: 'absolute',
    top: 8,
    left: 20,
    right: 20,
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
    overflow: 'hidden',
  },
  stepTrackFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: darkTheme.colors.accent,
  },
  stepItem: {
    alignItems: 'center',
    width: 62,
  },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#4A4A6A',
    borderWidth: 1,
    borderColor: '#5F5F80',
  },
  stepDotActive: {
    backgroundColor: darkTheme.colors.accent,
    borderColor: darkTheme.colors.accent,
  },
  stepDotCurrent: {
    borderWidth: 2,
    borderColor: darkTheme.colors.accent,
  },
  stepCircleWrap: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIconWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: {
    marginTop: darkTheme.spacing.xs,
    fontSize: 11,
    lineHeight: 14,
    color: darkTheme.colors.muted,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: darkTheme.colors.accent,
  },
  mechanicCard: {
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
    borderRadius: darkTheme.radius.lg,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: darkTheme.spacing.md,
  },
  mechanicRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF7B4A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: darkTheme.spacing.sm,
  },
  avatarText: {
    color: darkTheme.colors.text,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  mechanicInfo: {
    flex: 1,
  },
  mechanicName: {
    color: darkTheme.colors.text,
    fontSize: darkTheme.typography.fontSizes.md,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  mechanicAddress: {
    marginTop: 2,
    fontSize: darkTheme.typography.fontSizes.xs,
    flexShrink: 1,
  },
  addressRatingRow: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: darkTheme.spacing.xs,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 4,
  },
  ratingText: {
    color: darkTheme.colors.text,
    fontSize: darkTheme.typography.fontSizes.xs,
  },
  actionRow: {
    marginTop: darkTheme.spacing.md,
    flexDirection: 'row',
    columnGap: darkTheme.spacing.sm,
  },
  callBtn: {
    flex: 1,
    minHeight: 44,
  },
  messageBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: darkTheme.radius.lg,
    borderWidth: 1,
    borderColor: darkTheme.colors.accent,
    flexDirection: 'row',
    columnGap: darkTheme.spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageBtnText: {
    color: darkTheme.colors.accent,
    fontSize: darkTheme.typography.fontSizes.sm,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  nextBtn: {
    alignSelf: 'center',
    marginTop: darkTheme.spacing.md,
    paddingVertical: darkTheme.spacing.xs,
  },
  nextBtnText: {
    color: darkTheme.colors.muted,
    fontSize: darkTheme.typography.fontSizes.xs,
  },
  doneWrap: {
    marginTop: darkTheme.spacing.sm,
    alignItems: 'center',
  },
  doneText: {
    color: '#68F08A',
    fontSize: darkTheme.typography.fontSizes.sm,
    marginBottom: darkTheme.spacing.xs,
  },
  rateBtn: {
    borderWidth: 1,
    borderColor: darkTheme.colors.accent,
    borderRadius: darkTheme.radius.md,
    paddingHorizontal: darkTheme.spacing.md,
    paddingVertical: darkTheme.spacing.xs,
    marginTop: darkTheme.spacing.xs,
  },
  rateBtnDisabled: {
    opacity: 0.7,
  },
  rateBtnText: {
    color: darkTheme.colors.accent,
    fontSize: darkTheme.typography.fontSizes.sm,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
});

export default LiveTrackingScreen;
