import React, { useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';
import { AppText, ScreenContainer } from '../../components';
import { LEGAL_LAST_UPDATED, TERMS_SECTIONS } from '../../content/legalContent';
import { darkTheme } from '../../theme';
import { ScrollView } from 'react-native';

const PRIVACY_URL = 'https://brodameko.app/privacy-policy-for-brodameko-mobile-application/';

const PrivacyPolicyScreen = ({ navigation, route }) => {
  const initialDoc = String(route?.params?.documentType || 'privacy').toLowerCase() === 'terms' ? 'terms' : 'privacy';
  const [activeDoc, setActiveDoc] = useState(initialDoc);
  const [webLoading, setWebLoading] = useState(true);
  const [webError, setWebError] = useState(false);
  const webViewRef = useRef(null);

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} activeOpacity={0.85} onPress={() => navigation.goBack()}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color={darkTheme.colors.text} strokeWidth={2.1} />
        </TouchableOpacity>
        <AppText style={styles.title}>Legal documents</AppText>
        <View style={styles.backButton} />
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeDoc === 'privacy' ? styles.tabBtnActive : null]}
          activeOpacity={0.85}
          onPress={() => { setActiveDoc('privacy'); setWebError(false); setWebLoading(true); }}
        >
          <AppText style={[styles.tabLabel, activeDoc === 'privacy' ? styles.tabLabelActive : null]}>Privacy Policy</AppText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeDoc === 'terms' ? styles.tabBtnActive : null]}
          activeOpacity={0.85}
          onPress={() => setActiveDoc('terms')}
        >
          <AppText style={[styles.tabLabel, activeDoc === 'terms' ? styles.tabLabelActive : null]}>Terms & Conditions</AppText>
        </TouchableOpacity>
      </View>

      {activeDoc === 'privacy' ? (
        <View style={styles.webContainer}>
          {webError ? (
            <View style={styles.errorState}>
              <AppText style={styles.errorText}>Could not load the page.</AppText>
              <TouchableOpacity
                style={styles.retryBtn}
                activeOpacity={0.85}
                onPress={() => { setWebError(false); setWebLoading(true); webViewRef.current?.reload(); }}
              >
                <AppText style={styles.retryText}>Retry</AppText>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <WebView
                ref={webViewRef}
                source={{ uri: PRIVACY_URL }}
                style={styles.webView}
                onLoadStart={() => { setWebLoading(true); setWebError(false); }}
                onLoadEnd={() => setWebLoading(false)}
                onError={() => { setWebLoading(false); setWebError(true); }}
                onHttpError={() => { setWebLoading(false); setWebError(true); }}
              />
              {webLoading && (
                <View style={styles.webLoader}>
                  <ActivityIndicator size="large" color={darkTheme.colors.accent} />
                </View>
              )}
            </>
          )}
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <AppText style={styles.updatedText}>Last updated: {LEGAL_LAST_UPDATED}</AppText>
          {TERMS_SECTIONS.map(section => (
            <View key={section.title} style={styles.section}>
              <AppText style={styles.sectionTitle}>{section.title}</AppText>
              <AppText style={styles.sectionBody}>{section.body}</AppText>
            </View>
          ))}
        </ScrollView>
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
  },
  header: {
    minHeight: 44,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: darkTheme.colors.text,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 8,
    marginTop: 8,
    marginBottom: 4,
  },
  tabBtn: {
    flex: 1,
    minHeight: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  tabBtnActive: {
    borderColor: darkTheme.colors.accent,
    backgroundColor: 'rgba(230,199,20,0.16)',
  },
  tabLabel: {
    color: darkTheme.colors.muted,
    fontSize: 13,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  tabLabelActive: {
    color: darkTheme.colors.accent,
  },
  webContainer: {
    flex: 1,
  },
  webView: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
  },
  webLoader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: darkTheme.colors.background,
  },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  errorText: {
    color: darkTheme.colors.muted,
    fontSize: 14,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(230,199,20,0.45)',
  },
  retryText: {
    color: darkTheme.colors.accent,
    fontSize: 14,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  content: {
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 24,
  },
  updatedText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginBottom: 10,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    color: darkTheme.colors.text,
    fontSize: 14,
    fontWeight: darkTheme.typography.fontWeights.semibold,
    marginBottom: 5,
  },
  sectionBody: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    lineHeight: 19,
  },
});

export default PrivacyPolicyScreen;
