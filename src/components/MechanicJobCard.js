import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Location01Icon, Time04Icon } from '@hugeicons/core-free-icons';
import AppText from './AppText';
import { darkTheme, withAlpha } from '../theme';
import { getMechanicAssignedJob } from '../services/jobs.service';

const ownerNameCache = new Map();
const ownerNameInflight = new Map();

const formatEta = (raw) => {
  const text = String(raw || '').trim();
  if (!text) return '';

  // Already contains 'h' formatting — leave as-is.
  if (/\dh/i.test(text)) return text;

  // Try to extract total minutes from strings like "90 minutes", "45 mins", "90", "1 hour 30 min"
  let totalMinutes = null;

  const hoursMatch = text.match(/(\d+(?:\.\d+)?)\s*h(?:ou?r?s?)?/i);
  const minsMatch = text.match(/(\d+(?:\.\d+)?)\s*m(?:in(?:ute)?s?)?/i);

  if (hoursMatch || minsMatch) {
    const h = hoursMatch ? parseFloat(hoursMatch[1]) : 0;
    const m = minsMatch ? parseFloat(minsMatch[1]) : 0;
    totalMinutes = Math.round(h * 60 + m);
  } else {
    // Plain number — treat as minutes.
    const plain = parseFloat(text);
    if (Number.isFinite(plain)) totalMinutes = Math.round(plain);
  }

  if (totalMinutes === null) return text;

  if (totalMinutes < 60) return `${totalMinutes}m`;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
};

const initialsFromName = (name) =>
  String(name || 'M')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

const readOwnerDisplayName = (job, fallback = 'Customer') => {
  const firstName =
    job?.car_owner?.first_name ||
    job?.owner?.first_name ||
    job?.user?.first_name ||
    '';
  const lastName =
    job?.car_owner?.last_name ||
    job?.owner?.last_name ||
    job?.user?.last_name ||
    '';
  const combined = String(`${firstName} ${lastName}`).trim();
  return (
    combined ||
    String(
      job?.owner_name ||
        job?.car_owner_name ||
        job?.customer_name ||
        job?.car_owner?.full_name ||
        job?.car_owner?.fullName ||
        job?.car_owner?.name ||
        job?.owner?.full_name ||
        job?.owner?.fullName ||
        job?.owner?.name ||
        job?.user?.full_name ||
        job?.user?.fullName ||
        job?.user?.name ||
        fallback
    ).trim()
  );
};

const readOwnerNameFromAssignedJobDetails = (response) => {
  const payload = response?.data || response || {};
  const root = payload?.data || payload || {};
  const owner = root?.car_owner || root?.owner || root?.user || {};
  return readOwnerDisplayName(
    {
      car_owner: owner,
      owner,
      user: owner,
      owner_name: owner?.full_name || owner?.fullName || owner?.name || '',
      car_owner_name: owner?.full_name || owner?.fullName || owner?.name || '',
      customer_name: owner?.full_name || owner?.fullName || owner?.name || '',
    },
    ''
  );
};

const looksLikeFallbackName = (value) => {
  const text = String(value || '').trim().toLowerCase();
  return !text || text === 'customer';
};

const MechanicJobCard = ({
  name,
  jobId,
  issue,
  carMake,
  avatarUri,
  urgent = false,
  distanceText = '',
  etaText = '',
  actions,
  style,
}) => {
  const safeJobId = String(jobId || '').trim();
  const [resolvedName, setResolvedName] = React.useState(String(name || '').trim() || 'Customer');

  React.useEffect(() => {
    const incomingName = String(name || '').trim();
    if (!looksLikeFallbackName(incomingName)) {
      setResolvedName(incomingName);
      if (safeJobId) {
        ownerNameCache.set(safeJobId, incomingName);
      }
      return;
    }

    if (!safeJobId) {
      setResolvedName(incomingName || 'Customer');
      return;
    }

    const cached = ownerNameCache.get(safeJobId);
    if (cached) {
      setResolvedName(cached);
      return;
    }

    let cancelled = false;
    const existingInflight = ownerNameInflight.get(safeJobId);

    const loadName = existingInflight || (async () => {
      try {
        const details = await getMechanicAssignedJob(safeJobId);
        const ownerName = readOwnerNameFromAssignedJobDetails(details);
        if (ownerName) {
          ownerNameCache.set(safeJobId, ownerName);
          return ownerName;
        }
      } catch {
        // No-op: keep fallback.
      } finally {
        ownerNameInflight.delete(safeJobId);
      }
      return '';
    })();

    if (!existingInflight) {
      ownerNameInflight.set(safeJobId, loadName);
    }

    loadName.then((ownerName) => {
      if (cancelled || !ownerName) {
        return;
      }
      setResolvedName(ownerName);
    });

    return () => {
      cancelled = true;
    };
  }, [name, safeJobId]);

  const distance = String(distanceText || '').trim() || 'Distance unavailable';
  const eta = formatEta(etaText) || 'ETA unavailable';

  return (
    <View style={[styles.card, style]}>
      <View style={styles.jobTop}>
        <View style={styles.jobTopLeft}>
          <View style={styles.jobAvatar}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <AppText style={styles.jobAvatarText}>{initialsFromName(resolvedName)}</AppText>
            )}
          </View>
          <View style={styles.jobMain}>
            <AppText style={styles.jobName}>{String(resolvedName || 'Customer')}</AppText>
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
