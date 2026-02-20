import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import SharedChatScreen from '../../shared/ChatScreen';
import { AppBottomNav, AppText } from '../../../components';
import { ROLES, ROUTES } from '../../../utils';

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

  if (!hasValidParams) {
    return null;
  }

  const mechanic = route?.params?.mechanic || {
    name: 'Samuel Olamilekan',
    initials: 'SO',
    distanceKm: 1.2,
  };

  const recipient = {
    name: mechanic.name,
    initials: mechanic.initials || 'M',
    metaText: mechanic.distanceKm ? `${mechanic.distanceKm}km away` : null,
  };

  const issueSummary = route?.params?.issueSummary || {};
  const summaryLines = [
    issueSummary?.issueType ? `Issue: ${issueSummary.issueType}` : '',
    issueSummary?.description ? `Description: ${issueSummary.description}` : '',
    issueSummary?.carMake ? `Car make: ${issueSummary.carMake}` : '',
    Array.isArray(issueSummary?.images) && issueSummary.images.length ? `Images: ${issueSummary.images.length}` : '',
  ].filter(Boolean);

  const renderIssueSummary = () => {
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
  };

  const renderBottomNav = () => (
    <AppBottomNav activeTab={ROUTES.CAR_OWNER_SETTINGS} onTabPress={(routeName) => navigation.navigate(routeName)} />
  );

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
    borderColor: 'rgba(226,255,49,0.45)',
    borderRadius: 12,
    backgroundColor: 'rgba(226,255,49,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    rowGap: 2,
  },
  summaryTitle: {
    color: '#E2FF31',
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
