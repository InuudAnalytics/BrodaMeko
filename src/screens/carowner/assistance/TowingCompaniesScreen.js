import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft01Icon, StarIcon } from '@hugeicons/core-free-icons';
import { AppButton, AppText, ScreenContainer } from '../../../components';
import TowingCompanyDetailsModal from '../../../components/towing/TowingCompanyDetailsModal';
import towingCompanies from '../../../data/towingCompanies';
import { darkTheme } from '../../../theme';

const TowingCompaniesScreen = ({ navigation }) => {
  const [selectedCompany, setSelectedCompany] = useState(null);
  const companies = useMemo(() => towingCompanies, []);
  const handleBookPress = (company) => {
    // TODO: call towing booking endpoint when backend exposes create-towing-request API.
    setSelectedCompany(company);
  };

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} activeOpacity={0.85} onPress={() => navigation.goBack()}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color={darkTheme.colors.text} strokeWidth={2.2} />
          </TouchableOpacity>
          <AppText style={styles.headerTitle}>Book a towing company</AppText>
          <View style={styles.backButtonSpacer} />
        </View>

        <AppText style={styles.subtitle}>
          You can directly book a towing company to help tow your vehicle.
        </AppText>

        <FlatList
          data={companies}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.companyRow}>
                <Image source={{ uri: item.image }} style={styles.avatar} />
                <View style={styles.companyMeta}>
                  <AppText style={styles.companyName}>{item.name}</AppText>
                  <View style={styles.ratingRow}>
                    <HugeiconsIcon icon={StarIcon} size={12} color={darkTheme.colors.accent} strokeWidth={2.2} />
                    <AppText style={styles.ratingText}>{Number(item.rating || 0).toFixed(1)}</AppText>
                    <AppText style={styles.dot}>·</AppText>
                    <AppText style={styles.distanceText}>{item.distance}</AppText>
                  </View>
                </View>
              </View>

              <AppButton
                label="Book"
                onPress={() => handleBookPress(item)}
                style={styles.bookBtn}
              />
            </View>
          )}
        />
      </View>

      <TowingCompanyDetailsModal
        visible={Boolean(selectedCompany)}
        company={selectedCompany}
        onClose={() => setSelectedCompany(null)}
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
  listContent: {
    paddingBottom: 24,
    rowGap: 12,
  },
  card: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 10,
    marginBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    resizeMode: 'cover',
  },
  companyMeta: {
    flex: 1,
  },
  companyName: {
    color: darkTheme.colors.text,
    fontSize: 18,
    lineHeight: 24,
  },
  ratingRow: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 4,
  },
  ratingText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    lineHeight: 14,
  },
  dot: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    lineHeight: 14,
  },
  distanceText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    lineHeight: 14,
  },
  bookBtn: {
    minHeight: 38,
    borderRadius: 12,
  },
});

export default TowingCompaniesScreen;
