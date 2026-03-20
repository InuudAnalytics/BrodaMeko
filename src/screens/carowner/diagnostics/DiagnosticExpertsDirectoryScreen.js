import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft01Icon, Location06Icon } from '@hugeicons/core-free-icons';
import { AppText, ScreenContainer } from '../../../components';
import ServiceProviderDetailsModal from '../../../components/towing/ServiceProviderDetailsModal';
import { fetchDiagnosticExpertDetails, fetchDiagnosticExperts } from '../../../services/assistance.service';
import { darkTheme } from '../../../theme';

const DiagnosticExpertsDirectoryScreen = ({ navigation }) => {
  const [experts, setExperts] = useState([]);
  const [selectedExpert, setSelectedExpert] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadExperts = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const response = await fetchDiagnosticExperts();
      setExperts(Array.isArray(response) ? response : []);
    } catch (error) {
      setExperts([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadExperts();
  }, []);

  const handleOpenExpert = async (expert) => {
    setSelectedExpert(expert);

    try {
      const details = await fetchDiagnosticExpertDetails(expert?.id);
      if (details) {
        setSelectedExpert(details);
      }
    } catch (error) {
      // Keep the list payload visible if the details request fails.
    }
  };

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.85}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color={darkTheme.colors.text} strokeWidth={2.2} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <AppText style={styles.headerTitle}>Diagnostic experts</AppText>
        </View>
        <View style={styles.backButtonSpacer} />
      </View>

      <AppText style={styles.subtitle}>
        View diagnostic providers near your coverage area and copy their contact details.
      </AppText>

      {isLoading ? (
        <View style={styles.feedbackWrap}>
          <ActivityIndicator color={darkTheme.colors.accent} />
        </View>
      ) : (
        <FlatList
          data={experts}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => handleOpenExpert(item)}>
              <View style={styles.topRow}>
                <View style={styles.avatar}>
                  <HugeiconsIcon icon={Location06Icon} size={20} color={darkTheme.colors.accent} strokeWidth={2} />
                </View>

                <View style={styles.details}>
                  <AppText style={styles.name}>{item.company_name}</AppText>
                  <AppText style={styles.locationText}>
                    {[item.city, item.state].filter(Boolean).join(', ') || item.country || 'Location not available'}
                  </AppText>
                  <AppText style={styles.metaText}>
                    {item.street ? item.street : 'Tap to view price list and contact information'}
                  </AppText>
                </View>
              </View>

              <View style={styles.bottomRow}>
                <AppText style={styles.priceLabel}>View details</AppText>
                <AppText style={styles.openLabel}>Open</AppText>
              </View>
            </Pressable>
          )}
          contentContainerStyle={experts.length ? styles.listContent : styles.emptyContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={() => loadExperts(true)} tintColor={darkTheme.colors.accent} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <HugeiconsIcon icon={Location06Icon} size={72} color="rgba(255,255,255,0.32)" strokeWidth={1.6} />
              <AppText style={styles.emptyText}>No diagnostic experts at present</AppText>
            </View>
          }
        />
      )}

      <ServiceProviderDetailsModal
        visible={Boolean(selectedExpert)}
        provider={selectedExpert}
        onClose={() => setSelectedExpert(null)}
        serviceLabel="diagnostic expert"
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonSpacer: {
    width: 36,
    height: 36,
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: darkTheme.colors.text,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  subtitle: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    color: 'rgba(255,255,255,0.64)',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  feedbackWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 14,
    paddingBottom: darkTheme.spacing.xxl,
    rowGap: 14,
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingBottom: darkTheme.spacing.xxl,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    rowGap: 12,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.68)',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(193,200,235,0.7)',
    backgroundColor: '#2B2D62',
    paddingTop: 12,
    paddingHorizontal: 12,
    paddingBottom: 12,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bottomRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  details: {
    flex: 1,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 15.5,
    lineHeight: 19,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  locationText: {
    marginTop: 4,
    color: '#D7DCF8',
    fontSize: 13,
    lineHeight: 17,
  },
  metaText: {
    marginTop: 3,
    color: '#8088B3',
    fontSize: 13,
    lineHeight: 18,
  },
  priceLabel: {
    color: '#9EA4C8',
    fontSize: 14,
    lineHeight: 18,
  },
  openLabel: {
    color: darkTheme.colors.accent,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
});

export default DiagnosticExpertsDirectoryScreen;
