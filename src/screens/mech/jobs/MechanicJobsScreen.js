import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Clock01Icon, Location01Icon } from '@hugeicons/core-free-icons';
import { AppButton, AppText, ScreenContainer } from '../../../components';
import { darkTheme } from '../../../theme';

const TABS = [
  { key: 'available', label: 'Available jobs' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
];

const AVAILABLE_JOBS = [
  {
    id: 'av_1',
    name: 'Amina Yusuf',
    issue: 'Flat tire - Toyota Camry',
    distanceKm: 1.3,
    etaMins: 2,
    urgent: true,
  },
  {
    id: 'av_2',
    name: 'Emeka Okafor',
    issue: 'Battery problem - Honda Accord',
    distanceKm: 2.7,
    etaMins: 8,
    urgent: false,
  },
  {
    id: 'av_3',
    name: 'Dami Ade',
    issue: 'Brake service - Lexus RX',
    distanceKm: 3.4,
    etaMins: 11,
    urgent: false,
  },
];

const ACTIVE_JOBS = [
  {
    id: 'ac_1',
    name: 'Chioma Nwosu',
    issue: 'Engine overheating - Toyota Corolla',
    distanceKm: 0.9,
    etaMins: 3,
    urgent: true,
  },
  {
    id: 'ac_2',
    name: 'Samuel Hassan',
    issue: 'Oil leak - BMW 3 Series',
    distanceKm: 2.1,
    etaMins: 7,
    urgent: false,
  },
];

const COMPLETED_JOBS = [
  {
    id: 'cp_1',
    name: 'Femi Williams',
    issue: 'Spark plug replacement - Kia Rio',
    distanceKm: 1.8,
    etaMins: 5,
  },
  {
    id: 'cp_2',
    name: 'Mercy Bello',
    issue: 'Brake pad change - Nissan Altima',
    distanceKm: 2.5,
    etaMins: 9,
  },
];

const initialsFromName = (name) => {
  return String(name || 'M')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
};

const JobCard = ({ item, tab, onAccept }) => {
  const isAvailable = tab === 'available';
  const isActive = tab === 'active';
  const isCompleted = tab === 'completed';

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.leftBlock}>
          <View style={styles.avatar}>
            <AppText style={styles.avatarText}>{initialsFromName(item.name)}</AppText>
          </View>
          <View style={styles.info}>
            <AppText style={styles.name}>{item.name}</AppText>
            <AppText style={styles.issue}>{item.issue}</AppText>
          </View>
        </View>

        {item.urgent ? (
          <View style={styles.urgentBadge}>
            <AppText style={styles.urgentText}>Urgent</AppText>
          </View>
        ) : null}
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <HugeiconsIcon icon={Location01Icon} size={14} color={darkTheme.colors.muted} strokeWidth={2.1} />
          <AppText style={styles.metaText}>{item.distanceKm}km away</AppText>
        </View>
        <View style={styles.metaItem}>
          <HugeiconsIcon icon={Clock01Icon} size={14} color={darkTheme.colors.muted} strokeWidth={2.1} />
          <AppText style={styles.metaText}>{item.etaMins} minutes</AppText>
        </View>
      </View>

      {isAvailable ? (
        <AppButton
          label="Accept job"
          onPress={() => onAccept(item)}
          style={styles.ctaBtn}
          textStyle={styles.ctaBtnText}
        />
      ) : null}

      {isActive ? (
        <AppButton label="View details" onPress={() => {}} style={styles.ctaBtn} textStyle={styles.ctaBtnText} />
      ) : null}

      {isCompleted ? (
        <View style={styles.completedChip}>
          <AppText style={styles.completedChipText}>Completed</AppText>
        </View>
      ) : null}
    </View>
  );
};

const MechanicJobsScreen = () => {
  const [activeTab, setActiveTab] = useState('available');

  const currentList = useMemo(() => {
    if (activeTab === 'active') {
      return ACTIVE_JOBS;
    }

    if (activeTab === 'completed') {
      return COMPLETED_JOBS;
    }

    return AVAILABLE_JOBS;
  }, [activeTab]);

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <View style={styles.container}>
        <View style={styles.tabWrap}>
          {TABS.map((tab) => {
            const isActive = tab.key === activeTab;
            return (
              <TouchableOpacity
                key={tab.key}
                activeOpacity={0.85}
                onPress={() => setActiveTab(tab.key)}
                style={[styles.tabBtn, isActive && styles.tabBtnActive]}
              >
                <AppText style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</AppText>
              </TouchableOpacity>
            );
          })}
        </View>

        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {currentList.map((item) => (
            <JobCard
              key={`${activeTab}-${item.id}`}
              item={item}
              tab={activeTab}
              onAccept={() => Alert.alert('Success', 'Job accepted')}
            />
          ))}
        </ScrollView>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000033',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  tabWrap: {
    flexDirection: 'row',
    columnGap: 8,
  },
  tabBtn: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 8,
  },
  tabBtnActive: {
    backgroundColor: darkTheme.colors.accent,
    borderColor: darkTheme.colors.accent,
  },
  tabText: {
    color: darkTheme.colors.text,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: darkTheme.typography.fontWeights.medium,
    textAlign: 'center',
  },
  tabTextActive: {
    color: '#1A1A1A',
  },
  listContent: {
    paddingTop: 12,
    paddingBottom: 28,
    rowGap: 10,
  },
  card: {
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    columnGap: 8,
  },
  leftBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    columnGap: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(226,255,49,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(226,255,49,0.42)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: darkTheme.colors.accent,
    fontSize: 12,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  info: {
    flex: 1,
  },
  name: {
    color: darkTheme.colors.text,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  issue: {
    marginTop: 2,
    color: darkTheme.colors.muted,
    fontSize: 12,
    lineHeight: 16,
  },
  urgentBadge: {
    borderWidth: 1,
    borderColor: darkTheme.colors.accent,
    backgroundColor: 'rgba(226,255,49,0.14)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  urgentText: {
    color: darkTheme.colors.accent,
    fontSize: 11,
    lineHeight: 14,
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
    fontSize: 12,
    lineHeight: 16,
  },
  ctaBtn: {
    marginTop: 10,
    minHeight: 42,
    borderRadius: 10,
  },
  ctaBtnText: {
    color: '#1A1A1A',
    fontSize: 14,
  },
  completedChip: {
    marginTop: 10,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  completedChipText: {
    color: darkTheme.colors.text,
    fontSize: 11,
    lineHeight: 14,
  },
});

export default MechanicJobsScreen;
