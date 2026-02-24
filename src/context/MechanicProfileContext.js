import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';

const STORAGE_KEY_BASE = '@brodameko/mechanic_profile';

const INITIAL_PROFILE = {
  profilePhotoUri: null,
  hasServicePricing: false,
  servicePricing: {},
  ninImages: [],
  certificateImages: [],
  bankDetails: null,
  skippedSteps: [],
};

const MechanicProfileContext = createContext(undefined);

const sanitizeProfile = (value) => {
  const next = value && typeof value === 'object' ? value : {};
  const bank = next.bankDetails && typeof next.bankDetails === 'object' ? next.bankDetails : null;

  return {
    profilePhotoUri: typeof next.profilePhotoUri === 'string' ? next.profilePhotoUri : null,
    hasServicePricing: Boolean(next.hasServicePricing),
    servicePricing: next.servicePricing && typeof next.servicePricing === 'object' ? next.servicePricing : {},
    ninImages: Array.isArray(next.ninImages) ? next.ninImages.filter(Boolean) : [],
    certificateImages: Array.isArray(next.certificateImages) ? next.certificateImages.filter(Boolean) : [],
    bankDetails: bank
      ? {
          id: String(bank.id || '').trim(),
          accountName: String(bank.accountName || '').trim(),
          accountNumber: String(bank.accountNumber || '').trim(),
          bankName: String(bank.bankName || '').trim(),
          isPrimary: Boolean(bank.isPrimary),
        }
      : null,
    skippedSteps: Array.isArray(next.skippedSteps) ? next.skippedSteps.filter(Boolean) : [],
  };
};

export const MechanicProfileProvider = ({ children }) => {
  const { user, role } = useAuth();
  const [mechanicProfile, setMechanicProfile] = useState(INITIAL_PROFILE);
  const [isHydrated, setIsHydrated] = useState(false);
  const ownerKey = useMemo(() => {
    const raw =
      user?.id ||
      user?._id ||
      user?.user_id ||
      user?.mechanic_id ||
      user?.email ||
      user?.phone_number ||
      user?.phoneNumber ||
      'guest';

    return String(raw || 'guest').trim() || 'guest';
  }, [user]);
  const storageKey = useMemo(() => `${STORAGE_KEY_BASE}:${String(role || 'unknown').toLowerCase()}:${ownerKey}`, [ownerKey, role]);

  useEffect(() => {
    const restore = async () => {
      setIsHydrated(false);
      try {
        const raw = await AsyncStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          setMechanicProfile(sanitizeProfile(parsed));
        } else {
          setMechanicProfile(INITIAL_PROFILE);
        }
      } catch {
        setMechanicProfile(INITIAL_PROFILE);
      } finally {
        setIsHydrated(true);
      }
    };

    restore();
  }, [storageKey]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    AsyncStorage.setItem(storageKey, JSON.stringify(mechanicProfile)).catch(() => {});
  }, [isHydrated, mechanicProfile, storageKey]);

  const setProfilePhoto = useCallback((uri) => {
    setMechanicProfile((prev) => ({
      ...prev,
      profilePhotoUri: uri ? String(uri) : null,
    }));
  }, []);

  const setHasServicePricing = useCallback((value) => {
    setMechanicProfile((prev) => ({
      ...prev,
      hasServicePricing: Boolean(value),
    }));
  }, []);

  const setServicePricing = useCallback((pricing) => {
    const normalized = pricing && typeof pricing === 'object' ? pricing : {};

    setMechanicProfile((prev) => ({
      ...prev,
      servicePricing: normalized,
      hasServicePricing: true,
    }));
  }, []);

  const setKyc = useCallback(({ ninImages = [] }) => {
    setMechanicProfile((prev) => ({
      ...prev,
      ninImages: Array.isArray(ninImages) ? ninImages.filter(Boolean) : [],
    }));
  }, []);

  const setCertificateImages = useCallback((images = []) => {
    setMechanicProfile((prev) => ({
      ...prev,
      certificateImages: Array.isArray(images) ? images.filter(Boolean) : [],
    }));
  }, []);

  const setBankDetails = useCallback((details) => {
    const normalized = details && typeof details === 'object'
      ? {
          id: String(details.id || '').trim(),
          accountName: String(details.accountName || '').trim(),
          accountNumber: String(details.accountNumber || '').trim(),
          bankName: String(details.bankName || '').trim(),
          isPrimary: Boolean(details.isPrimary),
        }
      : null;

    setMechanicProfile((prev) => ({
      ...prev,
      bankDetails: normalized,
    }));
  }, []);

  const resetMechanicProfile = useCallback(() => {
    setMechanicProfile(INITIAL_PROFILE);
  }, []);

  const markStepSkipped = useCallback((routeName) => {
    const value = String(routeName || '').trim();
    if (!value) {
      return;
    }

    setMechanicProfile((prev) => ({
      ...prev,
      skippedSteps: Array.from(new Set([...(prev.skippedSteps || []), value])),
    }));
  }, []);

  const clearSkippedStep = useCallback((routeName) => {
    const value = String(routeName || '').trim();
    if (!value) {
      return;
    }

    setMechanicProfile((prev) => ({
      ...prev,
      skippedSteps: (prev.skippedSteps || []).filter((step) => step !== value),
    }));
  }, []);

  const resetSkippedSteps = useCallback(() => {
    setMechanicProfile((prev) => ({
      ...prev,
      skippedSteps: [],
    }));
  }, []);

  const completedSteps = useMemo(() => {
    const bank = mechanicProfile.bankDetails || {};
    const hasBank = Boolean(bank.accountName && bank.accountNumber && bank.bankName);

    return {
      photo: Boolean(mechanicProfile.profilePhotoUri),
      id: mechanicProfile.ninImages.length > 0,
      certificate: mechanicProfile.certificateImages.length > 0,
      bank: hasBank,
      services: Boolean(
        mechanicProfile.hasServicePricing ||
        Object.keys(mechanicProfile.servicePricing || {}).length > 0
      ),
    };
  }, [mechanicProfile]);

  const completionPercent = useMemo(() => {
    const completedCount = Object.values(completedSteps).filter(Boolean).length;
    return completedCount * 20;
  }, [completedSteps]);

  const isComplete = completionPercent === 100;

  const value = useMemo(
    () => ({
      mechanicProfile,
      completedSteps,
      completionPercent,
      isComplete,
      isHydrated,
      setProfilePhoto,
      setHasServicePricing,
      setServicePricing,
      setKyc,
      setCertificateImages,
      setBankDetails,
      markStepSkipped,
      clearSkippedStep,
      resetSkippedSteps,
      resetMechanicProfile,
      skippedSteps: mechanicProfile.skippedSteps || [],
    }),
    [
      mechanicProfile,
      completedSteps,
      completionPercent,
      isComplete,
      isHydrated,
      setProfilePhoto,
      setHasServicePricing,
      setServicePricing,
      setKyc,
      setCertificateImages,
      setBankDetails,
      markStepSkipped,
      clearSkippedStep,
      resetSkippedSteps,
      resetMechanicProfile,
    ]
  );

  return <MechanicProfileContext.Provider value={value}>{children}</MechanicProfileContext.Provider>;
};

export const useMechanicProfile = () => {
  const context = useContext(MechanicProfileContext);

  if (!context) {
    throw new Error('useMechanicProfile must be used within MechanicProfileProvider');
  }

  return context;
};

export default MechanicProfileContext;
