import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Location01Icon, Time04Icon } from '@hugeicons/core-free-icons';
import AppText from './AppText';
import { darkTheme, withAlpha } from '../theme';

const initialsFromName = (name) =>
  String(name || 'M')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

const MechanicJobCard = ({
  name,
  issue,
  carMake,
  avatarUri,
  urgent = false,
  distanceText = '',
  etaText = '',
  actions,
  style,
}) => {
  const distance = String(distanceText || '').trim() || 'Distance unavailable';
  const eta = String(etaText || '').trim() || 'ETA unavailable';

  return (
    <View style={[styles.card, style]}>
      <View style={styles.jobTop}>
        <View style={styles.jobTopLeft}>
          <View style={styles.jobAvatar}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <AppText style={styles.jobAvatarText}>{initialsFromName(name)}</AppText>
            )}
          </View>
          <View style={styles.jobMain}>
            <AppText style={styles.jobName}>{String(name || 'Customer')}</AppText>
            <AppText style={styles.jobIssue}>
              {String(issue || 'Car issue')}
              {carMake ? ` - ${carMake}` : ''}
            </AppText>
          </View>
        </View>
        {urgent ? (
          <View style={styles.urgentPill}>
            <AppText style={styles.urgentText}>Urgent</AppText>
          </View>
        ) : null}
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <HugeiconsIcon icon={Location01Icon} size={14} color={darkTheme.colors.muted} strokeWidth={2.1} />
          <AppText style={styles.metaText}>{distance}</AppText>
        </View>
        <View style={styles.metaItem}>
          <HugeiconsIcon icon={Time04Icon} size={14} color={darkTheme.colors.muted} strokeWidth={2.1} />
          <AppText style={styles.metaText}>{eta}</AppText>
        </View>
      </View>

      <View style={styles.actionsWrap}>{actions}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    padding: 12,
  },
  jobTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    columnGap: 10,
  },
  jobTopLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    columnGap: 10,
  },
  jobAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(darkTheme.colors.accent, 0.22),
    borderWidth: 1,
    borderColor: withAlpha(darkTheme.colors.accent, 0.45),
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  jobAvatarText: {
    color: darkTheme.colors.accent,
    fontSize: 12,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  jobMain: {
    flex: 1,
  },
  jobName: {
    color: darkTheme.colors.text,
    fontSize: 14,
    lineHeight: 17,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  jobIssue: {
    marginTop: 2,
    color: darkTheme.colors.muted,
    fontSize: 11,
    lineHeight: 14,
  },
  urgentPill: {
    backgroundColor: '#5A1B1B',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  urgentText: {
    color: '#F5F5F5',
    fontSize: 10,
    lineHeight: 12,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  metaRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 4,
  },
  metaText: {
    color: darkTheme.colors.muted,
    fontSize: 11,
    lineHeight: 14,
  },
  actionsWrap: {
    marginTop: 10,
  },
});

export default MechanicJobCard;
