import React, { useCallback, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import SharedChatScreen from '../../shared/ChatScreen';
import { AppBottomNav, AppText } from '../../../components';
import { darkTheme } from '../../../theme';
import { ROLES, ROUTES } from '../../../utils';

const hexToRgba = (hex, alpha) => {
  const cleaned = String(hex || '').replace('#', '').trim();
  if (cleaned.length !== 6) {
    return `rgba(230,199,20,${alpha})`;
  }
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

const ChatScreen = ({ navigation, route }) => {
  const jobId = route?.params?.jobId;
  const mechanicId = route?.params?.mechanicId;
  const conversationId = String(route?.params?.conversationId || '').trim();
  const hasValidParams = Boolean(conversationId || (jobId && mechanicId));

  useEffect(() => {
    if (hasValidParams) {
      return;
    }

    if (navigation?.canGoBack?.()) {
      navigation.goBack();
    } else {
      navigation.navigate(ROUTES.CAR_OWNER_DASHBOARD);
    }
  }, [hasValidParams, navigation]);

  const mechanic = route?.params?.mechanic || {
    name: 'Samuel Olamilekan',
    initials: 'SO',
    distanceKm: 1.2,
  };

  const recipient = {
    name: mechanic.name,
    initials: mechanic.initials || 'M',
    avatarUri: mechanic?.avatar?.url || mechanic?.avatarUrl || mechanic?.avatarUri || '',
    metaText: mechanic.distanceKm ? `${mechanic.distanceKm}km away` : null,
  };

  const issueSummary = route?.params?.issueSummary || {};
  const summaryLines = [
    issueSummary?.issueType ? `Issue: ${issueSummary.issueType}` : '',
    issueSummary?.description ? `Description: ${issueSummary.description}` : '',
    issueSummary?.carMake ? `Car make: ${issueSummary.carMake}` : '',
    Array.isArray(issueSummary?.images) && issueSummary.images.length ? `Images: ${issueSummary.images.length}` : '',
  ].filter(Boolean);

  const renderIssueSummary = useCallback(() => {
    if (!summaryLines.length) {
      return null;
    }

    return (
      <View style={styles.summaryCard}>
        <AppText style={styles.summaryTitle}>Request details</AppText>
        {summaryLines.map((line) => (
          <AppText key={line} style={styles.summaryLine}>
            {line}
          </AppText>
        ))}
      </View>
    );
  }, [summaryLines]);

  const renderBottomNav = () => (
    <AppBottomNav activeTab={ROUTES.CAR_OWNER_SETTINGS} onTabPress={(routeName) => navigation.navigate(routeName)} />
  );

  if (!hasValidParams) {
    return null;
  }

  return (
    <SharedChatScreen
      navigation={navigation}
      route={route}
      recipient={recipient}
      currentUserRole={ROLES.CAR_OWNER}
      renderBottomNav={renderBottomNav}
      renderExtraContent={renderIssueSummary}
      onBackPress={() => navigation.goBack()}
    />
  );
};

const styles = StyleSheet.create({
  summaryCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: hexToRgba(darkTheme.colors.accent, 0.45),
    borderRadius: 12,
    backgroundColor: hexToRgba(darkTheme.colors.accent, 0.12),
    paddingHorizontal: 12,
    paddingVertical: 10,
    rowGap: 2,
  },
  summaryTitle: {
    color: darkTheme.colors.accent,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  summaryLine: {
    color: '#DCE2F0',
    fontSize: 12,
    lineHeight: 16,
  },
});

export default ChatScreen;
