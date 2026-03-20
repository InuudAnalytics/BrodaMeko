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
import { fetchTowingServiceDetails, fetchTowingServices } from '../../../services/assistance.service';
import { darkTheme } from '../../../theme';

const TowingServicesDirectoryScreen = ({ navigation }) => {
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);

  const loadCompanies = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const response = await fetchTowingServices();
      setCompanies(Array.isArray(response) ? response : []);
    } catch (error) {
      setCompanies([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  const handleOpenCompany = async (company) => {
    setSelectedCompany(company);

    try {
      const details = await fetchTowingServiceDetails(company?.id);
      if (details) {
        setSelectedCompany(details);
      }
    } catch (error) {
      // Keep the list payload visible if the details request fails.
    }
  };

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} activeOpacity={0.85} onPress={() => navigation.goBack()}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color={darkTheme.colors.text} strokeWidth={2.2} />
          </TouchableOpacity>
          <AppText style={styles.headerTitle}>Towing services</AppText>
          <View style={styles.backButtonSpacer} />
        </View>

        <AppText style={styles.subtitle}>
          Browse towing providers, view their details, and copy their contact information.
        </AppText>

        {isLoading ? (
          <View style={styles.feedbackWrap}>
            <ActivityIndicator color={darkTheme.colors.accent} />
          </View>
        ) : (
          <FlatList
            data={companies}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={companies.length ? styles.listContent : styles.emptyContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={() => loadCompanies(true)} tintColor={darkTheme.colors.accent} />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <HugeiconsIcon icon={Location06Icon} size={72} color="rgba(255,255,255,0.32)" strokeWidth={1.6} />
                <AppText style={styles.emptyText}>No towing services at present</AppText>
              </View>
            }
            renderItem={({ item }) => (
              <Pressable style={styles.card} onPress={() => handleOpenCompany(item)}>
                <View style={styles.companyRow}>
                  <View style={styles.avatar}>
                    <HugeiconsIcon icon={Location06Icon} size={18} color={darkTheme.colors.accent} strokeWidth={2} />
                  </View>
                  <View style={styles.companyMeta}>
                    <AppText style={styles.companyName}>{item.company_name}</AppText>
                    <AppText style={styles.locationText}>
                      {[item.city, item.state].filter(Boolean).join(', ') || item.country || 'Location not available'}
                    </AppText>
                    <AppText style={styles.coverageText}>
                      {item.street ? item.street : 'Tap to view contact details and full coverage'}
                    </AppText>
                  </View>
                </View>

                <View style={styles.footerRow}>
                  <AppText style={styles.footerHint}>Tap to view details</AppText>
                  <AppText style={styles.footerAction}>Open</AppText>
                </View>
              </Pressable>
            )}
          />
        )}
      </View>

      <ServiceProviderDetailsModal
        visible={Boolean(selectedCompany)}
        provider={selectedCompany}
        onClose={() => setSelectedCompany(null)}
        serviceLabel="towing service"
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#010037',
  },
  container: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  header: {
    minHeight: 42,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  backButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonSpacer: {
    width: 34,
    height: 34,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: darkTheme.colors.text,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 14,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.6)',
    fontSize: 15,
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  feedbackWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingBottom: 24,
    rowGap: 12,
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 24,
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
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    columnGap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  companyMeta: {
    flex: 1,
  },
  companyName: {
    color: darkTheme.colors.text,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  locationText: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.78)',
    fontSize: 13,
    lineHeight: 18,
  },
  coverageText: {
    marginTop: 2,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    lineHeight: 17,
  },
  footerRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerHint: {
    color: 'rgba(255,255,255,0.58)',
    fontSize: 12,
    lineHeight: 16,
  },
  footerAction: {
    color: darkTheme.colors.accent,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
});

export default TowingServicesDirectoryScreen;
