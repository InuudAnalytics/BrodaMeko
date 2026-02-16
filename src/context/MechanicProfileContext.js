import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = '@brodameko/mechanic_profile';

const INITIAL_PROFILE = {
  profilePhotoUri: null,
  hasServicePricing: false,
  ninImages: [],
  passportImages: [],
  bankDetails: null,
};

const MechanicProfileContext = createContext(undefined);

const sanitizeProfile = (value) => {
  const next = value && typeof value === 'object' ? value : {};
  const bank = next.bankDetails && typeof next.bankDetails === 'object' ? next.bankDetails : null;

  return {
    profilePhotoUri: typeof next.profilePhotoUri === 'string' ? next.profilePhotoUri : null,
    hasServicePricing: Boolean(next.hasServicePricing),
    ninImages: Array.isArray(next.ninImages) ? next.ninImages.filter(Boolean) : [],
    passportImages: Array.isArray(next.passportImages) ? next.passportImages.filter(Boolean) : [],
    bankDetails: bank
      ? {
          accountName: String(bank.accountName || '').trim(),
          accountNumber: String(bank.accountNumber || '').trim(),
          bankName: String(bank.bankName || '').trim(),
        }
      : null,
  };
};

export const MechanicProfileProvider = ({ children }) => {
  const [mechanicProfile, setMechanicProfile] = useState(INITIAL_PROFILE);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const restore = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          setMechanicProfile(sanitizeProfile(parsed));
        }
      } catch {
        setMechanicProfile(INITIAL_PROFILE);
      } finally {
        setIsHydrated(true);
      }
    };

    restore();
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mechanicProfile)).catch(() => {});
  }, [isHydrated, mechanicProfile]);

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

  const setKyc = useCallback(({ ninImages = [], passportImages = [] }) => {
    setMechanicProfile((prev) => ({
      ...prev,
      ninImages: Array.isArray(ninImages) ? ninImages.filter(Boolean) : [],
      passportImages: Array.isArray(passportImages) ? passportImages.filter(Boolean) : [],
    }));
  }, []);

  const setBankDetails = useCallback((details) => {
    const normalized = details && typeof details === 'object'
      ? {
          accountName: String(details.accountName || '').trim(),
          accountNumber: String(details.accountNumber || '').trim(),
          bankName: String(details.bankName || '').trim(),
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

  const completedSteps = useMemo(() => {
    const bank = mechanicProfile.bankDetails || {};
    const hasBank = Boolean(bank.accountName && bank.accountNumber && bank.bankName);

    return {
      photo: Boolean(mechanicProfile.profilePhotoUri),
      pricing: Boolean(mechanicProfile.hasServicePricing),
      kyc: mechanicProfile.ninImages.length > 0 && mechanicProfile.passportImages.length > 0,
      bank: hasBank,
    };
  }, [mechanicProfile]);

  const completionPercent = useMemo(() => {
    const completedCount = Object.values(completedSteps).filter(Boolean).length;
    return completedCount * 25;
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
      setKyc,
      setBankDetails,
      resetMechanicProfile,
    }),
    [
      mechanicProfile,
      completedSteps,
      completionPercent,
      isComplete,
      isHydrated,
      setProfilePhoto,
      setHasServicePricing,
      setKyc,
      setBankDetails,
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
